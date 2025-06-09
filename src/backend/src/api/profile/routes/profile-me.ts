/**
 * Custom routes for the current user's profile
 */

export default {
  routes: [
    // Get current user's profile
    {
      method: 'GET',
      path: '/profiles/me',
      handler: 'profile.me',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::profile.profile.me'],
        },
      },
    },
  ],
}; 