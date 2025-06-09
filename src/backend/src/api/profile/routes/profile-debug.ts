/**
 * Debug routes for authentication testing
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/api/auth-debug',
      handler: 'profile.debugAuth',
      config: {
        auth: {
          strategies: ['users-permissions']
        },
      },
    },
  ],
}; 