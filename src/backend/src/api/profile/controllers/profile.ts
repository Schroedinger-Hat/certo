/**
 * profile controller
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'
const { ApplicationError } = errors

// Define interface for profile
interface ProfileWithCredentials {
  id: any
  name: string
  email?: string
  issuedCredentials?: any[]
  receivedCredentials?: any[]
}

// Define interface for profile with public keys
interface ProfileWithPublicKeys {
  id: any
  name: string
  email?: string
  url?: string
  did?: string
  publicKey?: Array<{
    id: string
    type: string
    publicKeyJwk?: any
  }>
}

export default factories.createCoreController('api::profile.profile', ({ strapi }) => ({
  // Custom controller methods for profile
  
  /**
   * Get the current user's profile
   */
  async me(ctx) {
    try {
      if (!ctx.state.user) {
        return ctx.unauthorized('You must be logged in');
      }

      const userEmail = ctx.state.user.email;
      
      // Find profile by email
      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { email: userEmail },
      });
      
      // Return the first profile that matches the email
      if (profiles && profiles.length > 0) {
        return { data: profiles[0] };
      }
      
      // If no profile found, return error
      return ctx.notFound('Profile not found for the current user');
    } catch (err) {
      console.error('Error fetching current user profile:', err);
      return ctx.badRequest('Error fetching profile', { error: err });
    }
  },
  
  /**
   * Get credentials issued by the current user
   */
  async myIssuedCredentials(ctx) {
    try {
      console.log("myIssuedCredentials called");
      console.log("User authenticated:", !!ctx.state.user);
      
      if (!ctx.state.user) {
        console.log("No user in ctx.state");
        return ctx.unauthorized('You must be logged in');
      }

      const userEmail = ctx.state.user.email;
      console.log("Looking for profile with email:", userEmail);
      
      // Find profile by email
      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { email: userEmail },
      });
      
      console.log("Found profiles:", profiles?.length || 0);
      
      // Return the issued credentials
      if (profiles && profiles.length > 0) {
        const profileId = profiles[0].id;
        console.log("Profile ID:", profileId);
        
        // Get credentials where this profile is the issuer
        const credentials = await strapi.entityService.findMany('api::credential.credential', {
          filters: {
            issuer: { id: profileId }
          },
          populate: ['achievement', 'recipient']
        }) as any[];
        
        console.log("Found issued credentials:", credentials?.length || 0);
        
        // Format the response in Strapi's data/attributes format
        return { 
          data: credentials.map(credential => {
            // Create a clean credential object with proper typing
            const formattedCredential = {
              id: credential.id,
              attributes: {
                ...credential
              }
            };
            
            // Safely add related entities if they exist
            if (credential.achievement) {
              formattedCredential.attributes.achievement = {
                data: {
                  id: credential.achievement.id,
                  attributes: credential.achievement
                }
              };
            }
            
            if (credential.recipient) {
              formattedCredential.attributes.recipient = {
                data: {
                  id: credential.recipient.id,
                  attributes: credential.recipient
                }
              };
            }
            
            return formattedCredential;
          })
        };
      }
      
      // If no profile found, return empty array
      console.log("No profile found, returning empty array");
      return { data: [] };
    } catch (err) {
      console.error('Error fetching issued credentials:', err);
      return ctx.badRequest('Error fetching issued credentials', { error: err });
    }
  },
  
  /**
   * Get credentials received by the current user
   */
  async myReceivedCredentials(ctx) {
    try {
      console.log("myReceivedCredentials called");
      console.log("User authenticated:", !!ctx.state.user);
      
      if (!ctx.state.user) {
        console.log("No user in ctx.state");
        return ctx.unauthorized('You must be logged in');
      }

      const userEmail = ctx.state.user.email;
      console.log("Looking for profile with email:", userEmail);
      
      // Find profile by email
      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { email: userEmail },
      });
      
      console.log("Found profiles:", profiles?.length || 0);
      
      // Return the received credentials
      if (profiles && profiles.length > 0) {
        const profileId = profiles[0].id;
        console.log("Profile ID:", profileId);
        
        // Get credentials where this profile is the recipient
        const credentials = await strapi.entityService.findMany('api::credential.credential', {
          filters: {
            recipient: { id: profileId }
          },
          populate: ['achievement', 'issuer']
        }) as any[];
        
        console.log("Found received credentials:", credentials?.length || 0);
        
        // Format the response in Strapi's data/attributes format
        return { 
          data: credentials.map(credential => {
            // Create a clean credential object with proper typing
            const formattedCredential = {
              id: credential.id,
              attributes: {
                ...credential
              }
            };
            
            // Safely add related entities if they exist
            if (credential.achievement) {
              formattedCredential.attributes.achievement = {
                data: {
                  id: credential.achievement.id,
                  attributes: credential.achievement
                }
              };
            }
            
            if (credential.issuer) {
              formattedCredential.attributes.issuer = {
                data: {
                  id: credential.issuer.id,
                  attributes: credential.issuer
                }
              };
            }
            
            return formattedCredential;
          })
        };
      }
      
      // If no profile found, return empty array
      console.log("No profile found, returning empty array");
      return { data: [] };
    } catch (err) {
      console.error('Error fetching received credentials:', err);
      return ctx.badRequest('Error fetching received credentials', { error: err });
    }
  },
  
  async findIssuedCredentials(ctx) {
    try {
      const { id } = ctx.params
      
      const profile = await strapi.entityService.findOne('api::profile.profile', id, {
        populate: ['issuedCredentials', 'issuedCredentials.achievement', 'issuedCredentials.recipient']
      }) as ProfileWithCredentials
      
      if (!profile) {
        return ctx.notFound('Profile not found')
      }
      
      return { data: profile.issuedCredentials || [] }
    } catch (err) {
      ctx.badRequest('Error fetching issued credentials', { error: err })
    }
  },
  
  async findReceivedCredentials(ctx) {
    try {
      const { id } = ctx.params
      
      const profile = await strapi.entityService.findOne('api::profile.profile', id, {
        populate: ['receivedCredentials', 'receivedCredentials.achievement', 'receivedCredentials.issuer']
      }) as ProfileWithCredentials
      
      if (!profile) {
        return ctx.notFound('Profile not found')
      }
      
      return { data: profile.receivedCredentials || [] }
    } catch (err) {
      ctx.badRequest('Error fetching received credentials', { error: err })
    }
  },

  /**
   * Get all public keys for a profile
   */
  async getPublicKeys(ctx) {
    try {
      const { id } = ctx.params

      // Find the profile with its public keys
      const profile = await strapi.entityService.findOne('api::profile.profile', id, {
        populate: ['publicKey']
      }) as ProfileWithPublicKeys

      if (!profile) {
        return ctx.notFound('Profile not found')
      }

      // Format the keys according to Open Badges 3.0 spec
      const keys = (profile.publicKey || []).map(key => ({
        id: key.id,
        type: key.type || 'Ed25519VerificationKey2020',
        controller: profile.did || `did:web:${ctx.request.header.host}:profiles:${id}`,
        publicKeyJwk: key.publicKeyJwk
      }))

      return { data: keys }
    } catch (err) {
      console.error('Error fetching public keys:', err)
      return ctx.internalServerError('Error fetching public keys')
    }
  },

  /**
   * Get public keys in JWKS format
   */
  async getJWKS(ctx) {
    try {
      const { id } = ctx.params

      // Find the profile with its public keys
      const profile = await strapi.entityService.findOne('api::profile.profile', id, {
        populate: ['publicKey']
      }) as ProfileWithPublicKeys

      if (!profile) {
        return ctx.notFound('Profile not found')
      }

      // Format the keys in JWKS format
      const keys = (profile.publicKey || [])
        .filter(key => key.publicKeyJwk)
        .map(key => ({
          ...key.publicKeyJwk,
          kid: key.id || `${profile.id}-${key.type}`,
          use: 'sig',
          alg: key.type === 'Ed25519VerificationKey2020' ? 'EdDSA' : 'ES256K'
        }))

      return {
        keys
      }
    } catch (err) {
      console.error('Error fetching JWKS:', err)
      return ctx.internalServerError('Error fetching JWKS')
    }
  }
})) 