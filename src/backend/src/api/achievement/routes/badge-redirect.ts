/**
 * Badge redirect routes
 * Maintains backward compatibility by redirecting /api/badges to /api/achievements
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/badges',
      handler: 'achievement.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/badges/:id',
      handler: 'achievement.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/badges',
      handler: 'achievement.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/badges/:id',
      handler: 'achievement.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/badges/:id',
      handler: 'achievement.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
} 