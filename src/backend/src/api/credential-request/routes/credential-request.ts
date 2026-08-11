/**
 * credential-request routes
 */
export default {
  routes: [
    // Submit a new credential request
    {
      method: 'POST',
      path: '/credential-requests',
      handler: 'credential-request.create',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    // List credential requests (filtered by role)
    {
      method: 'GET',
      path: '/credential-requests',
      handler: 'credential-request.find',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    // Get a single request
    {
      method: 'GET',
      path: '/credential-requests/:id',
      handler: 'credential-request.findOne',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    // Approve a request (issuer only)
    {
      method: 'POST',
      path: '/credential-requests/:id/approve',
      handler: 'credential-request.approve',
      config: { auth: { strategies: ['users-permissions'] } },
    },
    // Reject a request (issuer only)
    {
      method: 'POST',
      path: '/credential-requests/:id/reject',
      handler: 'credential-request.reject',
      config: { auth: { strategies: ['users-permissions'] } },
    },
  ],
};
