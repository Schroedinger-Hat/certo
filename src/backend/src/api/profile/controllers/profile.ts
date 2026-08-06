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
        status: 'published',
        limit: 1
      });
      
      // Return the first profile that matches
      if (profiles && profiles.length > 0) {
        return { data: profiles[0] };
      }

      return ctx.notFound('Profile not found for the current user');
    } catch (err) {
      console.error('Error fetching current user profile:', err);
      return ctx.badRequest('Error fetching profile', { error: err });
    }
  },

  /**
   * Export everything associated with the current user's own profile:
   * achievements it created, credentials it issued or received, and their
   * evidence. See services/data-portability.ts.
   */
  async exportMyData(ctx) {
    try {
      if (!ctx.state.user) {
        return ctx.unauthorized('You must be logged in');
      }

      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { email: ctx.state.user.email },
        status: 'published',
        limit: 1,
      });

      if (!profiles || profiles.length === 0) {
        return ctx.notFound('Profile not found for the current user');
      }

      const dataPortability = strapi.service('api::profile.data-portability');
      return await dataPortability.exportProfileData(profiles[0]);
    } catch (err) {
      console.error('Error exporting profile data:', err);
      return ctx.badRequest('Error exporting profile data', { error: err });
    }
  },

  /**
   * Restores achievements/credentials the current user's profile previously
   * exported via exportMyData - never someone else's data, never
   * credentials merely *received* by this profile. See
   * services/data-portability.ts.
   */
  async importMyData(ctx) {
    try {
      if (!ctx.state.user) {
        return ctx.unauthorized('You must be logged in');
      }

      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { email: ctx.state.user.email },
        status: 'published',
        limit: 1,
      });

      if (!profiles || profiles.length === 0) {
        return ctx.notFound('Profile not found for the current user');
      }

      const dataPortability = strapi.service('api::profile.data-portability');
      return await dataPortability.importProfileData(profiles[0], ctx.request.body || {});
    } catch (err) {
      console.error('Error importing profile data:', err);
      return ctx.badRequest('Error importing profile data', { error: err });
    }
  },

  /**
   * Per-issuer analytics: real credential/achievement counts for the
   * current user's profile, replacing the hardcoded placeholder values
   * the frontend was previously showing. Served at
   * GET /api/dashboard/stats to match the existing API-client call.
   */
  async dashboardStats(ctx) {
    try {
      if (!ctx.state.user) {
        return ctx.unauthorized('You must be logged in');
      }

      const profiles = await strapi.entityService.findMany('api::profile.profile', {
        filters: { email: ctx.state.user.email },
        status: 'published',
        limit: 1,
      });

      if (!profiles || profiles.length === 0) {
        return ctx.notFound('Profile not found for the current user');
      }

      const dashboard = strapi.service('api::profile.dashboard');
      const stats = await dashboard.getStats(ctx.state.user.id, profiles[0].id);
      return { data: stats };
    } catch (err) {
      strapi.log.error('[dashboardStats] Error fetching stats', { error: (err as Error).message });
      return ctx.badRequest('Error fetching dashboard stats', { error: (err as Error).message });
    }
  },

  async findIssuedCredentials(ctx) {
    try {
      const { id } = ctx.params
      
      const profile = await strapi.entityService.findOne('api::profile.profile', id, {
        status: 'published',
        populate: {
          issuedCredentials: {
            populate: {
              achievement: {
                populate: ['image']
              },
              recipient: true
            }
          }
        }
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
        status: 'published',
        populate: {
          receivedCredentials: {
            populate: {
              achievement: {
                populate: ['image']
              },
              issuer: true
            }
          }
        }
      }) as ProfileWithCredentials
      
      if (!profile) {
        return ctx.notFound('Profile not found')
      }
      
      strapi.log.debug(`[profile.findReceivedCredentials] Found ${profile.receivedCredentials?.length || 0} credentials for profile ${id}`)

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
        status: 'published',
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

      return keys[0];
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
        status: 'published',
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
  },

  async getIssuer(ctx) {
    const { id } = ctx.params
    const profile = await strapi.entityService.findOne('api::profile.profile', id, {
      status: 'published',
      populate: ['publicKey']
    }) as ProfileWithPublicKeys

    return profile
  },
})) 