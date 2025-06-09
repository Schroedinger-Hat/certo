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
  ],
} 