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
            populate: [
              'achievement', 
              'achievement.image', 
              'achievement.criteria',
              'achievement.alignment',
              'achievement.skills',
              'issuer', 
              'issuer.image',
              'recipient', 
              'evidence',
              'proof'
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
        populate: [
          'achievement', 
          'achievement.image', 
          'achievement.criteria',
          'achievement.alignment',
          'achievement.skills',
          'issuer', 
          'issuer.image',
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
   * Verify a credential's cryptographic proof
   * This is a placeholder for the actual cryptographic verification
   * In a production environment, this would use a library like jsonld-signatures
   */
  async verifyProof(credential: CredentialWithRelations): Promise<{ valid: boolean; message?: string }> {
    try {
      // In a real implementation, we would:
      // 1. Fetch the issuer's public key using the verificationMethod in the proof
      // 2. Verify the signature using the appropriate algorithm (e.g., Ed25519, JsonWebSignature2020)
      // 3. Check that the proof was created by the expected issuer
      
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
      
      // For now, since we're not implementing actual cryptographic verification,
      // we'll accept any proof that passes the above checks
      return { valid: true };
    } catch (error) {
      console.error('Error verifying proof:', error);
      return { valid: false, message: `Error verifying proof: ${error.message}` };
    }
  }
}; 