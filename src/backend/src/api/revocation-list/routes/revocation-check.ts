export default {
  routes: [
    {
      method: 'GET',
      path: '/credentials/:credentialId/status',
      handler: 'revocation-list.checkStatus',
      config: {
        auth: false,
      },
    },
  ],
} 