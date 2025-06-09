export default {
  routes: [
    {
      method: 'GET',
      path: '/endorsements/:id/verify',
      handler: 'endorsement.verifyEndorsement',
      config: {
        auth: false,
      },
    },
  ],
} 