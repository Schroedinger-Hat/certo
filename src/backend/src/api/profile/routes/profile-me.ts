/**
 * Custom routes for the current user's profile
 */

export default {
  routes: [
    // Get current user's profile
    {
      method: 'GET',
      path: '/api/profiles/me',
      handler: 'profile.me',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          strategies: ['users-permissions']
        },
      },
    },
    // Get credentials issued by the current user
    {
      method: 'GET',
      path: '/api/profiles/me/issued-credentials',
      handler: 'profile.myIssuedCredentials',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          strategies: ['users-permissions']
        },
      },
    },
    // Get credentials received by the current user
    {
      method: 'GET',
      path: '/api/profiles/me/received-credentials',
      handler: 'profile.myReceivedCredentials',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          strategies: ['users-permissions']
        },
      },
    },
  ],
}; 