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
    // Export everything associated with the current user's own profile
    {
      method: 'GET',
      path: '/profiles/me/export',
      handler: 'profile.exportMyData',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::profile.profile.exportMyData'],
        },
      },
    },
    // Restore achievements/credentials into the current user's own profile
    // from a bundle previously produced by /profiles/me/export
    {
      method: 'POST',
      path: '/profiles/me/import',
      handler: 'profile.importMyData',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::profile.profile.importMyData'],
        },
      },
    },
    // Per-issuer analytics dashboard stats (called by api-client.getDashboardStats)
    {
      method: 'GET',
      path: '/dashboard/stats',
      handler: 'profile.dashboardStats',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['api::profile.profile.dashboardStats'],
        },
      },
    },
  ],
};