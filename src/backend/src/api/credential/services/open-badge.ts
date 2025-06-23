/**
 * Open Badges service
 */

// Define a type for the OpenBadgeCredential
interface OpenBadgeCredential {
  '@context': string[]
  id: string
  type: string[]
  issuer: {
    id: string
    type: string[]
    name: string
    url?: string
    image?: {
      id: string
      type: string
    }
  }
  issuanceDate: string
  name: string
  description: string
  credentialSubject: {
    id?: string
    type: string[]
    achievement: {
      id: string
      type: string[]
      name: string
      description: string
      criteria?: {
        narrative?: string
        id?: string
      }
      image?: {
        id: string
        type: string
      }
      alignments?: any[]
      evidence?: any[]
    }
  }
  expirationDate?: string
  proof?: any[]
}

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
      
      // For proof verification, we would need to:
      // 1. Get the issuer's public key
      // 2. Verify the proof using the key
      // This is a placeholder
      const proofVerified = true;
      
      // Check expiration
      const now = new Date();
      let expired = false;
      if (credential.expirationDate) {
        expired = new Date(credential.expirationDate) < now;
      }
      
      return {
        verified: issuerVerified && proofVerified && !expired,
        checks: [
          { check: 'format', result: validFormat.valid ? 'success' : 'error', message: validFormat.error },
          { check: 'issuer', result: issuerVerified ? 'success' : 'warning', message: issuerVerified ? null : 'Issuer not verified' },
          { check: 'proof', result: proofVerified ? 'success' : 'error', message: proofVerified ? null : 'Invalid proof' },
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
   * Find an issuer by URL
   */
  async findIssuerByUrl(url) {
    try {
      const issuer = await strapi.db.query('api::profile.profile').findOne({
        where: { url }
      });
      
      return issuer;
    } catch (error) {
      console.error('Error finding issuer by URL:', error);
      return null;
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
      })
      
      if (!credential) {
        throw new Error('Credential not found')
      }
      
      // Base URL for this application
      const baseUrl = strapi.config.get('server.url') || 'http://localhost:1337'
      
      // Build the Open Badge Verifiable Credential
      const obCredential: OpenBadgeCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://purl.imsglobal.org/spec/ob/v3p0/context.json'
        ],
        id: credential.credentialId,
        type: credential.type || ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: credential.issuer ? {
          id: `${baseUrl}/api/profiles/${credential.issuer.id}`,
          type: ['Profile'],
          name: credential.issuer.name,
          url: credential.issuer.url,
          image: credential.issuer.image ? {
            id: `${baseUrl}${credential.issuer.image.url}`,
            type: 'Image'
          } : undefined
        } : {
          id: `${baseUrl}/api/profiles/system`,
          type: ['Profile'],
          name: 'System Issuer'
        },
        issuanceDate: credential.issuanceDate,
        name: credential.name || credential.achievement.name,
        description: credential.description || credential.achievement.description,
        credentialSubject: {
          id: credential.recipient ? `${baseUrl}/api/profiles/${credential.recipient.id}` : undefined,
          type: ['Profile'],
          achievement: {
            id: `${baseUrl}/api/achievements/${credential.achievement.id}`,
            type: ['Achievement'],
            name: credential.achievement.name,
            description: credential.achievement.description,
            criteria: credential.achievement.criteria ? {
              narrative: credential.achievement.criteria.narrative,
              id: credential.achievement.criteria.url
            } : undefined,
            image: credential.achievement.image ? {
              id: `${baseUrl}${credential.achievement.image.url}`,
              type: 'Image'
            } : undefined,
            alignments: credential.achievement.alignment?.map(align => ({
              targetName: align.targetName,
              targetUrl: align.targetUrl,
              targetDescription: align.targetDescription,
              targetFramework: align.targetFramework,
              targetCode: align.targetCode
            })) || []
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
      
      // Add expiration date if available
      if (credential.expirationDate) {
        obCredential.expirationDate = credential.expirationDate
      }
      
      // Add proof if available
      if (credential.proof && credential.proof.length > 0) {
        obCredential.proof = credential.proof.map(p => ({
          type: p.type,
          created: p.created,
          verificationMethod: p.verificationMethod,
          proofPurpose: p.proofPurpose,
          proofValue: p.proofValue,
          jws: p.jws
        }))
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