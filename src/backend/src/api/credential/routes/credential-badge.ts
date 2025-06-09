/**
 * Badge-specific routes for credentials
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
    {
      method: 'GET',
      path: '/badges/:id',
      handler: 'credential.getBadge',
      config: {
        auth: false,
        middlewares: [],
      },
    },
  ] as Route[],
}; 