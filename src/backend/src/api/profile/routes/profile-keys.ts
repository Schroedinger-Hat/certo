/**
 * Profile routes for public key exposure
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/profiles/:id/keys',
      handler: 'profile.getPublicKeys',
      config: {
        auth: false,
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/profiles/:id/.well-known/jwks.json',
      handler: 'profile.getJWKS',
      config: {
        auth: false,
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/profiles/:id/issuer',
      handler: 'profile.getIssuer',
      config: {
        auth: false,
        middlewares: [],
      },
    },
  ],
} 