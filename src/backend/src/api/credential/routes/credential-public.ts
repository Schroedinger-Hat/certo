/**
 * Custom routes for public credential access
 */

export default {
  routes: [
    // Public route for getting a specific credential
    {
      method: 'GET',
      path: '/api/credentials/:id',
      handler: 'credential.findOne',
      config: {
        auth: false
      }
    },
    // Public route for verifying a credential
    {
      method: 'GET',
      path: '/api/credentials/:id/verify',
      handler: 'credential.verify',
      config: {
        auth: false
      }
    },
    // Public route for validating a credential
    {
      method: 'POST',
      path: '/api/credentials/validate',
      handler: 'credential.validate',
      config: {
        auth: false
      }
    }
  ]
} 