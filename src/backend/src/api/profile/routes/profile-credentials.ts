export default {
  routes: [
    {
      method: 'GET',
      path: '/profiles/:id/issued-credentials',
      handler: 'profile.findIssuedCredentials',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/profiles/:id/received-credentials',
      handler: 'profile.findReceivedCredentials',
      config: {
        auth: false,
      },
    },
  ],
} 