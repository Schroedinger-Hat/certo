/**
 * Custom routes for authenticated credential access
 */

export default {
  routes: [
    // Authenticated route for getting all credentials
    {
      method: 'GET',
      path: '/credentials',
      handler: 'credential.find',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for creating a credential
    {
      method: 'POST',
      path: '/credentials',
      handler: 'credential.create',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for updating a credential
    {
      method: 'PUT',
      path: '/credentials/:id',
      handler: 'credential.update',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for deleting a credential
    {
      method: 'DELETE',
      path: '/credentials/:id',
      handler: 'credential.delete',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for issuing a credential
    {
      method: 'POST',
      path: '/credentials/issue',
      handler: 'credential.issue',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for exporting a credential
    {
      method: 'GET',
      path: '/credentials/:id/export',
      handler: 'credential.export',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for importing a credential
    {
      method: 'POST',
      path: '/credentials/import',
      handler: 'credential.import',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for revoking a credential
    {
      method: 'POST',
      path: '/credentials/:id/revoke',
      handler: 'credential.revoke',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    },
    // Authenticated route for batch issuing credentials
    {
      method: 'POST',
      path: '/credentials/batch-issue',
      handler: 'credential.batchIssue',
      config: {
        auth: {
          strategies: ['users-permissions']
        }
      }
    }
  ]
} 