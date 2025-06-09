/**
 * Fallback route for credentials access
 * This ensures we have a public access as a last resort
 */

export default {
  routes: [
    // Fallback public route for getting all credentials
    {
      method: 'GET',
      path: '/api/credentials',
      handler: 'credential.find',
      config: {
        auth: false
      }
    }
  ]
} 