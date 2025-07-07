/**
 * Custom achievement routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/achievements/:id/credentials',
      handler: 'achievement.findWithCredentials',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/achievements/creator/:creatorId',
      handler: 'achievement.findByCreator',
      config: {
        auth: false,
      },
    },
  ],
} 