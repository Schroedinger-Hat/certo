/**
 * Custom routes for the credential API
 */

interface RouteConfig {
  policies?: string[];
  middlewares?: string[];
  auth?: boolean;
}

interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  config: RouteConfig;
}

export default {
  routes: [
    // Credential issuance
    {
      method: 'POST',
      path: '/credentials/issue',
      handler: 'credential.issue',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Credential verification
    {
      method: 'GET',
      path: '/credentials/:id/verify',
      handler: 'credential.verify',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Certificate image direct access route
    {
      method: 'GET',
      path: '/verify/:id',
      handler: 'credential.getDirectCertificate',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Validate external credential
    {
      method: 'POST',
      path: '/credentials/validate',
      handler: 'credential.validate',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Export credential
    {
      method: 'GET',
      path: '/credentials/:id/export',
      handler: 'credential.export',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Import credential
    {
      method: 'POST',
      path: '/credentials/import',
      handler: 'credential.import',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Revoke credential
    {
      method: 'POST',
      path: '/credentials/:id/revoke',
      handler: 'credential.revoke',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
    
    // Get certificate
    {
      method: 'GET',
      path: '/credentials/:id/certificate',
      handler: 'credential.getCertificate',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ] as Route[],
}; 