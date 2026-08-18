export default {
  routes: [
    {
      method: 'GET',
      path: '/webhook-subscriptions',
      handler: 'webhook-subscription.find',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    {
      method: 'GET',
      path: '/webhook-subscriptions/:id',
      handler: 'webhook-subscription.findOne',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    {
      method: 'POST',
      path: '/webhook-subscriptions',
      handler: 'webhook-subscription.create',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    {
      method: 'PUT',
      path: '/webhook-subscriptions/:id',
      handler: 'webhook-subscription.update',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    {
      method: 'DELETE',
      path: '/webhook-subscriptions/:id',
      handler: 'webhook-subscription.delete',
      config: { auth: { strategies: ['users-permissions'] } },
    },
  ],
}