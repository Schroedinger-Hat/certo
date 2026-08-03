/**
 * Verification service for Open Badges credentials
 */

import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

// Define interface for credential with all required properties
interface CredentialWithRelations {
  id: any;
  credentialId: string;
  name?: string;
  description?: string;
  issuanceDate: Date;
  expirationDate?: Date;
  revoked: boolean;
  revocationReason?: string;
  achievement?: any;
  issuer?: any;
  recipient?: any;
  evidence?: any[];
  proof?: any[];
  statusList?: any;
  statusListIndex?: number;
}

/**
 * Verification service for Open Badges 3.0 credentials
 */
export default {
  /**
   * Verify a credential's cryptographic proof
   * @param credential The credential to verify
   * @returns Object with verified status and details
   */
  async verifyCredential(credentialId: string) {
    try {
      // Check if the search string is a full URN (urn:uuid:...)
      if (!credentialId.startsWith('urn:uuid:')) {
        // Try to find by ID first
        try {
          // Find the credential with all necessary relationships using the credentialId field
          const credentials = await strapi.entityService.findMany('api::credential.credential', {
            filters: { id: parseInt(credentialId, 10) },
            status: 'published',
            populate: [
              'achievement', 
              'achievement.image', 
              'achievement.criteria',
              'achievement.alignment',
              'achievement.skills',
              'issuer',
              'issuer.image',
              'issuer.publicKey',
              'recipient',
              'evidence',
              'proof',
              'statusList'
            ],
          });

          if (credentials && credentials.length > 0) {
            return await this.processCredentialResult(credentials[0] as CredentialWithRelations);
          }
        } catch (error) {
          // Continue to search by credentialId if ID lookup fails
          console.log('ID lookup failed, trying credentialId:', error.message);
        }
      }

      // Find the credential with all necessary relationships using the credentialId field
      const credentials = await strapi.entityService.findMany('api::credential.credential', {
        filters: { credentialId: credentialId },
        status: 'published',
        populate: [
          'achievement', 
          'achievement.image', 
          'achievement.criteria',
          'achievement.alignment',
          'achievement.skills',
          'issuer',
          'issuer.image',
          'issuer.publicKey',
          'recipient',
          'evidence',
          'proof'
        ],
      });

      if (!credentials || credentials.length === 0) {
        throw new ApplicationError('Credential not found');
      }

      return await this.processCredentialResult(credentials[0] as CredentialWithRelations);
    } catch (error) {
      console.error('Error verifying credential:', error);
      throw new ApplicationError(`Error verifying credential: ${error.message}`);
    }
  },

  /**
   * Process a credential verification result
   */
  async processCredentialResult(credential: CredentialWithRelations) {
    // Convert to Open Badge format for consistent frontend display
    const openBadgeService = strapi.service('api::credential.open-badge');
    const serializedCredential = await openBadgeService.serializeCredential(credential.id);

    // Check if credential is revoked
    if (credential.revoked) {
      return {
        verified: false,
        checks: [
          { check: 'not_revoked', result: 'error', message: credential.revocationReason || 'Credential has been revoked' }
        ],
        credential: serializedCredential,
        rawCredential: credential
      };
    }

    // Check if credential is expired
    if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
      return {
        verified: false,
        checks: [
          { check: 'not_expired', result: 'error', message: 'Credential has expired' }
        ],
        credential: serializedCredential,
        rawCredential: credential
      };
    }

    // Also consult the issuer's revocation status list, in addition to the
    // `revoked` boolean above. Defense in depth for locally-issued
    // credentials: this is the only path that would catch a bug where the
    // two ever disagree. Note that importCredential() doesn't currently
    // link an imported credential to a local status list at all (that
    // would need fetching/checking a remote issuer's published status
    // list, a separate interop feature), so this doesn't yet add real
    // coverage for externally-issued credentials.
    if (credential.statusList && credential.statusListIndex != null) {
      const revocationListService = strapi.service('api::revocation-list.revocation-list');
      const revokedInList = await revocationListService.checkStatusInList(credential.statusList, credential.statusListIndex);
      if (revokedInList) {
        return {
          verified: false,
          checks: [
            { check: 'not_revoked', result: 'error', message: 'Credential is marked revoked in the issuer\'s status list' }
          ],
          credential: serializedCredential,
          rawCredential: credential
        };
      }
    }

    // Verify proof(s)
    let proofResult: { valid: boolean; message?: string | null } = { valid: true, message: null };
    if (credential.proof && credential.proof.length > 0) {
      proofResult = await this.verifyProof(credential);
    } else {
      proofResult = { valid: false, message: 'No proof found on credential' };
    }

    if (!proofResult.valid) {
      return {
        verified: false,
        checks: [
          { check: 'proof', result: 'error', message: proofResult.message || 'Invalid credential proof' }
        ],
        credential: serializedCredential,
        rawCredential: credential
      };
    }

    // All checks passed
    return {
      verified: true,
      checks: [
        { check: 'not_revoked', result: 'success' },
        { check: 'not_expired', result: 'success' },
        { check: 'proof', result: 'success' }
      ],
      credential: serializedCredential,
      rawCredential: credential
    };
  },

  /**
   * Verify a credential's cryptographic proof: structural checks first,
   * then an actual Ed25519/JWS signature check against the issuer's
   * public key (api::profile.issuer-keys).
   */
  async verifyProof(credential: CredentialWithRelations): Promise<{ valid: boolean; message?: string }> {
    try {
      // Check if the credential has proofs
      if (!credential.proof || credential.proof.length === 0) {
        return { valid: false, message: 'No proof found on credential' };
      }

      // Get the first proof (in a production system, you might verify multiple proofs)
      const proof = credential.proof[0];

      // Check that the proof has all required fields
      if (!proof.type || !proof.created || !proof.verificationMethod || !proof.proofPurpose) {
        return { valid: false, message: 'Proof is missing required fields' };
      }

      // Check that the proof has a value (either proofValue or jws)
      if (!proof.proofValue && !proof.jws) {
        return { valid: false, message: 'Proof is missing value (proofValue or jws)' };
      }

      // Check that the proofPurpose is valid
      if (proof.proofPurpose !== 'assertionMethod' &&
          proof.proofPurpose !== 'authentication' &&
          proof.proofPurpose !== 'keyAgreement') {
        return { valid: false, message: `Invalid proof purpose: ${proof.proofPurpose}` };
      }

      // Check that the proof isn't too old (e.g., created more than 10 years ago)
      const proofDate = new Date(proof.created);
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      if (proofDate < tenYearsAgo) {
        return { valid: false, message: 'Proof is too old' };
      }

      // A proofValue (rather than jws) means this credential was signed
      // before per-issuer keys existed, or signing failed and fell back to
      // a placeholder - either way there's no real signature to check.
      if (!proof.jws) {
        return { valid: false, message: 'Proof has no JWS to verify (proofValue-only proofs are not cryptographically verifiable)' };
      }

      if (!credential.issuer?.id) {
        return { valid: false, message: 'Credential has no issuer to verify the proof against' };
      }

      const { jwtVerify, importJWK, importSPKI } = await import('jose');

      const issuerKeys = strapi.service('api::profile.issuer-keys');
      const publicKey = await issuerKeys.getPublicKey(credential.issuer.id);
      if (publicKey) {
        try {
          await jwtVerify(proof.jws, publicKey);
          return { valid: true };
        } catch (verifyError) {
          return { valid: false, message: `Signature verification failed: ${verifyError.message}` };
        }
      }

      // Fall back to the issuer's profile-level publicKey component. Older/
      // migrated production issuers may only have a key there (predating the
      // api::issuer-key.issuer-key table), so try every non-revoked entry
      // before giving up. Some of these entries don't hold a spec-shaped JWK
      // - e.g. this app's own JWKs have a flat { kty, crv, x }, but keys
      // entered from elsewhere have been seen with `publicKeyJwk` wrapping a
      // `{ jwk: [...] }` array whose "x" is actually a base64 DER SPKI blob,
      // and/or the same DER blob duplicated into `publicKeyMultibase`
      // (not real multibase encoding). Try every shape we've actually seen.
      const toPem = (base64Der: string) =>
        `-----BEGIN PUBLIC KEY-----\n${(base64Der.match(/.{1,64}/g) || [base64Der]).join('\n')}\n-----END PUBLIC KEY-----\n`;

      const candidateKeysFor = async (key: any) => {
        const attempts: Array<() => Promise<any>> = [];

        if (key.publicKeyJwk?.kty) {
          attempts.push(() => importJWK(key.publicKeyJwk, 'EdDSA'));
        }

        const wrappedJwks = key.publicKeyJwk?.jwk;
        if (Array.isArray(wrappedJwks)) {
          for (const entry of wrappedJwks) {
            if (entry?.kty) attempts.push(() => importJWK(entry, 'EdDSA'));
            if (entry?.x) attempts.push(() => importSPKI(toPem(entry.x), 'EdDSA'));
          }
        }

        if (typeof key.publicKeyMultibase === 'string') {
          attempts.push(() => importSPKI(toPem(key.publicKeyMultibase), 'EdDSA'));
        }

        const candidates = [];
        for (const attempt of attempts) {
          const candidate = await attempt().catch(() => null);
          if (candidate) candidates.push(candidate);
        }
        return candidates;
      };

      const profileKeys = (credential.issuer.publicKey || []).filter(
        (key) => !key.revoked && (key.publicKeyJwk || key.publicKeyMultibase)
      );

      for (const key of profileKeys) {
        for (const candidate of await candidateKeysFor(key)) {
          try {
            await jwtVerify(proof.jws, candidate);
            return { valid: true };
          } catch {
            // Try the next candidate key.
          }
        }
      }

      return { valid: false, message: 'Issuer has no signing key on record' };
    } catch (error) {
      console.error('Error verifying proof:', error);
      return { valid: false, message: `Error verifying proof: ${error.message}` };
    }
  }
}; 