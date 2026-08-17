/**
 * Open Badges service
 */

export default ({ strapi }) => ({
  /**
   * Validate an external Open Badge 3.0 credential
   */
  async validateExternalCredential(credential) {
    try {
      // Check if the credential has a valid format
      const validFormat = this.validateCredentialFormat(credential);
      if (!validFormat.valid) {
        return {
          verified: false,
          error: validFormat.error
        };
      }
      
      // Check if the issuer is known
      const issuerIdentifier = credential.issuer.id || credential.issuer;
      let issuerVerified = false;
      
      // If the issuer is a string, it should be a URL or DID
      if (typeof issuerIdentifier === 'string') {
        // For DIDs, we would validate against a DID resolver
        if (issuerIdentifier.startsWith('did:')) {
          // Placeholder for DID verification
          issuerVerified = true;
        } 
        // For URLs, we can check if it's a known issuer in our system
        else if (issuerIdentifier.startsWith('http')) {
          const knownIssuer = await this.findIssuerByUrl(issuerIdentifier);
          issuerVerified = !!knownIssuer;
        }
      }
      
      // Real cryptographic proof verification for externally-submitted
      // credentials. Resolves the issuer's verification method (URL or DID),
      // fetches the public key, and verifies the proof's JWS signature.
      const proofResult = await this.verifyExternalProof(credential);
      
      // Check expiration
      const now = new Date();
      let expired = false;
      if (credential.expirationDate) {
        expired = new Date(credential.expirationDate) < now;
      }
      
      return {
        verified: issuerVerified && proofResult.valid && !expired,
        checks: [
          { check: 'format', result: validFormat.valid ? 'success' : 'error', message: validFormat.error },
          { check: 'issuer', result: issuerVerified ? 'success' : 'warning', message: issuerVerified ? null : 'Issuer not verified' },
          { check: 'proof', result: proofResult.valid ? 'success' : 'error', message: proofResult.message || null },
          { check: 'expiration', result: !expired ? 'success' : 'error', message: expired ? 'Credential has expired' : null }
        ],
        credential: {
          id: credential.id,
          type: credential.type,
          name: credential.name || 'Unnamed credential',
          description: credential.description || '',
          issuer: typeof credential.issuer === 'string' ? { id: credential.issuer } : credential.issuer,
          credentialSubject: credential.credentialSubject,
          issuanceDate: credential.issuanceDate,
          validFrom: credential.issuanceDate,
          expirationDate: credential.expirationDate
        }
      };
    } catch (error) {
      console.error('Error validating external credential:', error);
      return {
        verified: false,
        error: `Error validating credential: ${error.message}`
      };
    }
  },
  
  /**
   * Validate the format of a credential
   */
  validateCredentialFormat(credential) {
    // Check required fields
    if (!credential.id) {
      return { valid: false, error: 'Missing credential id' };
    }
    
    if (!credential.type) {
      return { valid: false, error: 'Missing credential type' };
    }
    
    // Check that the type includes required values
    const types = Array.isArray(credential.type) ? credential.type : [credential.type];
    if (!types.includes('VerifiableCredential')) {
      return { valid: false, error: 'Credential must include VerifiableCredential type' };
    }
    
    if (!types.includes('OpenBadgeCredential')) {
      return { valid: false, error: 'Credential must include OpenBadgeCredential type' };
    }
    
    if (!credential.issuer) {
      return { valid: false, error: 'Missing credential issuer' };
    }
    
    if (!credential.credentialSubject) {
      return { valid: false, error: 'Missing credential subject' };
    }
    
    if (!credential.issuanceDate) {
      return { valid: false, error: 'Missing issuance date' };
    }
    
    // Validate issuer format
    if (typeof credential.issuer === 'object' && !credential.issuer.id) {
      return { valid: false, error: 'Issuer must have an id' };
    }
    
    return { valid: true };
  },
  
  /**
   * Verify an external credential's cryptographic proof.
   *
   * Resolves the verification method from the proof (a URL or DID),
   * fetches the issuer's public key, and verifies the JWS signature.
   * Returns { valid: boolean, message?: string }.
   */
  async verifyExternalProof(credential) {
    try {
      // A credential must have a proof to be cryptographically verifiable
      const proof = credential.proof;
      if (!proof) {
        return { valid: false, message: 'Credential has no proof to verify' };
      }

      // Support both single proof objects and arrays
      const proofObj = Array.isArray(proof) ? proof[0] : proof;
      if (!proofObj) {
        return { valid: false, message: 'Credential has no proof to verify' };
      }

      // The JWS signature is what we cryptographically verify. Some
      // credentials use proofValue (e.g. a base64-encoded signature for
      // Ed25519Signature2018) — for those we'd need type-specific verification.
      const jws = proofObj.jws;
      if (!jws) {
        // Try proofValue as a JWS-compatible compact serialization
        if (proofObj.proofValue) {
          return { valid: false, message: 'proofValue-only proofs are not supported for external verification yet' };
        }
        return { valid: false, message: 'Proof is missing jws' };
      }

      // Validate proofPurpose
      if (proofObj.proofPurpose && proofObj.proofPurpose !== 'assertionMethod') {
        return { valid: false, message: `Unsupported proof purpose: ${proofObj.proofPurpose}` };
      }

      // Resolve the verification method to find the issuer's public key.
      // The verificationMethod is usually a URL pointing to the issuer's key,
      // e.g. https://issuer.example.com/api/profiles/1/keys or a DID URL
      // like did:web:issuer.example.com#key-1.
      const verificationMethod = proofObj.verificationMethod;
      if (!verificationMethod) {
        return { valid: false, message: 'Proof is missing verificationMethod' };
      }

      // 1. If the verificationMethod points at our own issuer (via URL),
      //    look up the key from our local issuer-keys service.
      const baseUrl = strapi.config.get('server.url') || 'http://localhost:1337';
      const localProfileMatch = String(verificationMethod).match(/\/api\/profiles\/(\d+)\/keys/);
      if (localProfileMatch) {
        const profileId = parseInt(localProfileMatch[1], 10);
        const issuerKeys = strapi.service('api::profile.issuer-keys');
        const publicKey = await issuerKeys.getPublicKey(profileId);
        if (publicKey) {
          const { jwtVerify } = await import('jose');
          try {
            await jwtVerify(jws, publicKey);
            return { valid: true };
          } catch (verifyError) {
            return { valid: false, message: `Signature verification failed: ${verifyError.message}` };
          }
        }
      }

      // 2. If the verificationMethod is a remote HTTPS URL, fetch the key
      //    document from the issuer and extract a public key JWK to verify.
      if (String(verificationMethod).startsWith('https://') ||
          String(verificationMethod).startsWith('http://')) {
        try {
          const response = await fetch(verificationMethod, {
            headers: { Accept: 'application/json, application/ld+json' },
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok) {
            return { valid: false, message: `Failed to fetch verification method (HTTP ${response.status})` };
          }
          const keyDocument = await response.json();
          const candidates = await this.extractPublicKeysFromDocument(keyDocument);
          if (candidates.length === 0) {
            return { valid: false, message: 'No public keys found in verification method document' };
          }
          const { jwtVerify } = await import('jose');
          for (const key of candidates) {
            try {
              await jwtVerify(jws, key);
              return { valid: true };
            } catch {
              // Try the next candidate key.
            }
          }
          return { valid: false, message: 'Signature could not be verified with any key from the issuer' };
        } catch (fetchError) {
          return { valid: false, message: `Error fetching verification method: ${fetchError.message}` };
        }
      }

      // 3. DID support: did:web URLs can be resolved to a DID document,
      //    which lists public keys under verificationMethod.
      if (String(verificationMethod).startsWith('did:')) {
        const didUrl = String(verificationMethod);
        const didDocument = await this.resolveDid(didUrl);
        if (!didDocument) {
          return { valid: false, message: 'Failed to resolve DID' };
        }
        const candidates = await this.extractPublicKeysFromDocument(didDocument);
        if (candidates.length === 0) {
          return { valid: false, message: 'No public keys found in DID document' };
        }
        const { jwtVerify } = await import('jose');
        for (const key of candidates) {
          try {
            await jwtVerify(jws, key);
            return { valid: true };
          } catch {
            // Try the next candidate key.
          }
        }
        return { valid: false, message: 'Signature could not be verified with any key from the DID document' };
      }

      return { valid: false, message: `Unsupported verification method: ${verificationMethod}` };
    } catch (error) {
      console.error('Error verifying external proof:', error);
      return { valid: false, message: `Error verifying proof: ${error.message}` };
    }
  },

  /**
   * Extract public key candidates from a verification method document or
   * DID document. Returns an array of CryptoKey objects ready for jwtVerify.
   * Handles: { publicKeyJwk }, { "publicKeyMultibase" } (base64 Ed25519),
   * nested verificationMethod arrays, and jwks-style key sets.
   */
  async extractPublicKeysFromDocument(doc) {
    const candidates = [];
    const { importJWK, importSPKI } = await import('jose');

    // Normalize into a single array of key objects.
    const keyCandidates = [];
    if (doc.publicKeyJwk) {
      keyCandidates.push(doc.publicKeyJwk);
    }
    if (Array.isArray(doc.verificationMethod)) {
      for (const vm of doc.verificationMethod) {
        if (vm.publicKeyJwk) keyCandidates.push(vm.publicKeyJwk);
        if (Array.isArray(vm.publicKeyJwk?.jwk)) {
          keyCandidates.push(...vm.publicKeyJwk.jwk);
        }
        if (vm.publicKeyMultibase) keyCandidates.push({ multibase: vm.publicKeyMultibase });
      }
    } else if (doc.verificationMethod?.publicKeyJwk) {
      keyCandidates.push(doc.verificationMethod.publicKeyJwk);
    }
    if (Array.isArray(doc.publicKey)) {
      for (const pk of doc.publicKey) {
        if (pk.publicKeyJwk) keyCandidates.push(pk.publicKeyJwk);
        if (Array.isArray(pk.publicKeyJwk?.jwk)) {
          keyCandidates.push(...pk.publicKeyJwk.jwk);
        }
        if (pk.publicKeyMultibase) keyCandidates.push({ multibase: pk.publicKeyMultibase });
      }
    }
    // JWKS-style: { keys: [...] }
    if (Array.isArray(doc.keys)) {
      keyCandidates.push(...doc.keys);
    }
    // Our own issuer-keys publicKeyJwk shape: { kty, crv, x }
    if (doc.kty && doc.crv && doc.x) {
      keyCandidates.push(doc);
    }

    for (const key of keyCandidates) {
      try {
        if (key.kty && key.crv && key.x) {
          const cryptoKey = await importJWK(key, 'EdDSA');
          if (cryptoKey) candidates.push(cryptoKey);
        } else if (key.multibase) {
          // Base64-encoded raw Ed25519 public key; we can only verify with it
          // if it's DER/PEM wrapped SPKI, but try anyway.
          const base64 = key.multibase.startsWith('z')
            ? Buffer.from(key.multibase.slice(1), 'base64').toString('base64')
            : key.multibase;
          const pem = `-----BEGIN PUBLIC KEY-----\n${(base64.match(/.{1,64}/g) || [base64]).join('\n')}\n-----END PUBLIC KEY-----\n`;
          const cryptoKey = await importSPKI(pem, 'EdDSA');
          if (cryptoKey) candidates.push(cryptoKey);
        }
      } catch {
        // Skip malformed keys.
      }
    }

    return candidates;
  },

  /**
   * Resolve a DID (did:web or did:key) to its DID document.
   * did:web: <did:web:example.com:path> → https://example.com/path/did.json
   * did:key: single public key, no HTTP fetch needed.
   */
  async resolveDid(didUrl) {
    try {
      // did:web resolution
      if (didUrl.startsWith('did:web:')) {
        const authorityPath = didUrl.slice('did:web:'.length);
        // The identifier after # is a fragment, not part of the URL.
        const [didIdentifier] = authorityPath.split('#');
        // Convert did:web:example.com:path → https://example.com/path/did.json
        // (colon-separated segments become path segments; first is the host)
        const segments = didIdentifier.split(':');
        const host = segments[0];
        // Special case: a single leading "w" segment is the "www" shorthand.
        const pathSegments = segments.slice(1);
        const didJsonUrl = `https://${host}/${pathSegments.join('/')}/did.json`;
        const response = await fetch(didJsonUrl, {
          headers: { Accept: 'application/did+json, application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          return null;
        }
        return await response.json();
      }

      // did:key resolution — a single Ed25519 key in the multibase format.
      // did:key:z6Mk... maps directly to a public key.
      if (didUrl.startsWith('did:key:')) {
        const multibase = didUrl.slice('did:key:'.length);
        const base64 = Buffer.from(multibase.slice(1), 'base64').toString('base64');
        const pem = `-----BEGIN PUBLIC KEY-----\n${(base64.match(/.{1,64}/g) || [base64]).join('\n')}\n-----END PUBLIC KEY-----\n`;
        const { importSPKI } = await import('jose');
        const cryptoKey = await importSPKI(pem, 'EdDSA').catch(() => null);
        // Return a document-shaped object so extractPublicKeysFromDocument
        // can handle it uniformly.
        return cryptoKey ? { verificationMethod: [{ publicKeyJwk: null, publicKeyMultibase: multibase }] } : null;
      }

      return null;
    } catch (error) {
      console.error('Error resolving DID:', error);
      return null;
    }
  },

  /**
   * Find an issuer by URL
   */
  async findIssuerByUrl(url) {
    try {
      // Extract the numeric ID from the URL (e.g., /api/profiles/123)
      const match = url.match(/\/api\/profiles\/(\d+)/)
      if (!match) {
        console.error(`No numeric profile ID found in URL: ${url}`)
        return null
      }
      const id = parseInt(match[1], 10)
      if (isNaN(id)) {
        console.error(`Invalid profile ID extracted from URL: ${url}`)
        return null
      }
      const issuer = await strapi.db.query('api::profile.profile').findOne({
        where: { id },
        status: 'published'
      })
      return issuer
    } catch (error) {
      console.error('Error finding issuer by URL:', error)
      return null
    }
  },

  /**
   * Serialize a credential to Open Badges 3.0 Verifiable Credential format
   */
  async serializeCredential(credentialId) {
    try {
      // Fetch the credential with all its relations
      const credential = await strapi.entityService.findOne('api::credential.credential', credentialId, {
        status: 'published',
        populate: [
          'achievement', 
          'achievement.creator',
          'achievement.image', 
          'achievement.criteria',
          'achievement.alignment',
          'achievement.skills',
          'issuer', 
          'issuer.image',
          'recipient',
          'evidence',
          'proof',
          'statusList'
        ],
      })
      
      if (!credential) {
        throw new Error('Credential not found')
      }
      if (!credential.achievement.creator) {
        throw new Error('Credential is missing an associated achievement creator')
      }
      if (!credential.issuer) {
        throw new Error('Credential is missing an associated issuer')
      }
      
      // Base URL for this application
      const baseUrl = strapi.config.get('server.url') || 'http://localhost:1337'
      
      // Build the Open Badge Verifiable Credential
      const obCredential: any = {
        '@context': [
          'https://www.w3.org/ns/credentials/v2',
          'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
        ],
        id: credential.credentialId,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: {
          id: `${baseUrl}/api/profiles/${credential.issuer.id}/issuer`,
          type: ['Profile'],
          name: credential.issuer.name,
          url: credential.issuer.url
        },
        issuanceDate: credential.issuanceDate,
        validFrom: credential.issuanceDate,
        name: credential.name || credential.achievement.name,
        description: credential.description || credential.achievement.description,
        credentialSubject: {
          id: credential.recipient?.email ? `mailto:${credential.recipient.email}` : undefined,
          type: ['AchievementSubject'],
          achievement: {
            id: `${baseUrl}/api/achievements/${credential.achievement.id}`,
            type: ['Achievement'],
            name: credential.achievement.name,
            description: credential.achievement.description,
            image: credential.achievement.image ? {
              id: credential.achievement.image.url.startsWith('http')
                ? credential.achievement.image.url
                : `${baseUrl}${credential.achievement.image.url}`,
              type: 'Image'
            } : undefined,
            criteria: credential.achievement.criteria
              ? { narrative: credential.achievement.criteria.narrative }
              : { narrative: 'Criteria not specified' },
            ...(credential.achievement.alignment && credential.achievement.alignment.length > 0
              ? { alignments: credential.achievement.alignment.map(align => ({
                  targetName: align.targetName,
                  targetUrl: align.targetUrl,
                  targetDescription: align.targetDescription,
                  targetFramework: align.targetFramework,
                  targetCode: align.targetCode
                })) }
              : {})
          }
        }
      }
      
      // Add evidence if available
      if (credential.evidence && credential.evidence.length > 0) {
        obCredential.credentialSubject.achievement.evidence = credential.evidence.map(ev => ({
          id: `${baseUrl}/api/evidences/${ev.id}`,
          type: ['Evidence'],
          name: ev.name,
          description: ev.description,
          narrative: ev.narrative,
          genre: ev.genre,
          audience: ev.audience
        }))
      }
      
      // Add credentialStatus (StatusList2021) if this credential has a slot
      // in an issuer status list
      if (credential.statusList && credential.statusListIndex != null) {
        obCredential.credentialStatus = {
          id: `${baseUrl}/api/revocation-lists/${credential.statusList.id}#${credential.statusListIndex}`,
          type: 'StatusList2021Entry',
          statusPurpose: credential.statusList.statusPurpose || 'revocation',
          statusListIndex: String(credential.statusListIndex),
          statusListCredential: credential.statusList.statusListCredential
        }
      }

      // Add expiration date if available
      if (credential.expirationDate) {
        obCredential.expirationDate = credential.expirationDate
      }
      
      // Add proof if available (use only the first proof object if array)
      if (credential.proof && credential.proof.length > 0) {
        const p = credential.proof[0]
        obCredential.proof = {
          type: p.type,
          created: p.created,
          verificationMethod: p.verificationMethod,
          proofPurpose: p.proofPurpose,
          jws: p.jws
        }
      }
      
      // Add JWS proof if not present
      if (!obCredential.proof) {
        // Remove undefined/null url from issuer
        if (!obCredential.issuer.url) delete obCredential.issuer.url
        // Prepare payload for signing (full credential minus proof)
        const credentialPayload = { ...obCredential }
        delete credentialPayload.proof
        const issuerKeys = strapi.service('api::profile.issuer-keys')
        const { privateKey } = await issuerKeys.getOrCreateKeyPair(credential.issuer.id)
        const { SignJWT } = await import('jose')
        const jws = await new SignJWT(credentialPayload)
          .setProtectedHeader({ alg: 'EdDSA' })
          .sign(privateKey)
        obCredential.proof = {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          verificationMethod: `${baseUrl}/api/profiles/${credential.issuer.id}/keys`,
          proofPurpose: 'assertionMethod',
          jws
        }
      } else {
        // Remove undefined/null url from issuer
        if (!obCredential.issuer.url) delete obCredential.issuer.url
      }
      
      return obCredential
    } catch (error) {
      console.error('Error serializing credential:', error)
      throw error
    }
  },
  
  /**
   * Import a credential from an Open Badges 3.0 Verifiable Credential format
   */
  async importCredential(vcData) {
    try {
      // Validate that this is an Open Badge Credential
      if (!vcData.type || !vcData.type.includes('OpenBadgeCredential')) {
        throw new Error('Not a valid Open Badge Credential')
      }
      
      // Check if the credential already exists
      const existingCredential = await strapi.db.query('api::credential.credential').findOne({
        where: { credentialId: vcData.id }
      })
      
      if (existingCredential) {
        throw new Error('Credential already exists')
      }
      
      // Find or create the issuer profile
      let issuerId
      const issuerData = vcData.issuer
      
      if (issuerData) {
        const existingIssuer = await strapi.db.query('api::profile.profile').findOne({
          where: { did: issuerData.id }
        })
        
        if (existingIssuer) {
          issuerId = existingIssuer.id
        } else {
          // Create a new issuer profile
          const newIssuer = await strapi.entityService.create('api::profile.profile', {
            data: {
              name: issuerData.name,
              url: issuerData.url,
              did: issuerData.id,
              profileType: 'Issuer',
              description: issuerData.description,
              publishedAt: new Date()
            }
          })
          issuerId = newIssuer.id
        }
      }
      
      // Find or create the achievement
      let achievementId
      const achievementData = vcData.credentialSubject?.achievement
      
      if (achievementData) {
        const existingAchievement = await strapi.db.query('api::achievement.achievement').findOne({
          where: { achievementId: achievementData.id }
        })
        
        if (existingAchievement) {
          achievementId = existingAchievement.id
        } else {
          // Create a new achievement
          const newAchievement = await strapi.entityService.create('api::achievement.achievement', {
            data: {
              name: achievementData.name,
              description: achievementData.description,
              achievementId: achievementData.id,
              achievementType: achievementData.type?.[0] || 'Achievement',
              creator: issuerId,
              publishedAt: new Date()
            }
          })
          achievementId = newAchievement.id
          
          // Create criteria if available
          if (achievementData.criteria) {
            await strapi.db.query('components_badge_criteria').create({
              data: {
                narrative: achievementData.criteria.narrative,
                url: achievementData.criteria.id
              }
            })
          }
        }
      }
      
      // Find or create the recipient profile
      let recipientId
      const recipientData = vcData.credentialSubject
      
      if (recipientData && recipientData.id) {
        const existingRecipient = await strapi.db.query('api::profile.profile').findOne({
          where: { did: recipientData.id }
        })
        
        if (existingRecipient) {
          recipientId = existingRecipient.id
        } else {
          // Create a new recipient profile
          const newRecipient = await strapi.entityService.create('api::profile.profile', {
            data: {
              name: recipientData.name || 'Unknown Recipient',
              did: recipientData.id,
              profileType: 'Recipient',
              publishedAt: new Date()
            }
          })
          recipientId = newRecipient.id
        }
      }

      // Create the credential
      const credentialData = {
        credentialId: vcData.id,
        type: vcData.type,
        name: vcData.name,
        description: vcData.description,
        issuanceDate: vcData.issuanceDate ? new Date(vcData.issuanceDate) : new Date(),
        validFrom: vcData.issuanceDate ? new Date(vcData.issuanceDate) : new Date(),
        expirationDate: vcData.expirationDate ? new Date(vcData.expirationDate) : null,
        achievement: achievementId,
        issuer: issuerId,
        recipient: recipientId,
        revoked: false,
        publishedAt: new Date()
      }
      
      const credential = await strapi.entityService.create('api::credential.credential', {
        data: credentialData
      })
      
      // Add evidence if available
      if (vcData.credentialSubject?.achievement?.evidence) {
        for (const ev of vcData.credentialSubject.achievement.evidence) {
          await strapi.entityService.create('api::evidence.evidence', {
            data: {
              name: ev.name,
              description: ev.description,
              narrative: ev.narrative,
              genre: ev.genre,
              audience: ev.audience,
              url: ev.id,
              credential: credential.id,
              publishedAt: new Date()
            }
          })
        }
      }
      
      // Return the imported credential
      return credential
    } catch (error) {
      console.error('Error importing credential:', error)
      throw error
    }
  }
}) 