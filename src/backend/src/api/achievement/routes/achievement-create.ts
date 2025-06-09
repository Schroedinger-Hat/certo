/**
 * Custom route for creating achievements with proper tag handling
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/achievements/create',
      handler: 'achievement.createAchievement',
      config: {
        auth: false,
      },
    },
  ],
} 