export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 'res.cloudinary.com', 'localhost:1337', '*'],
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 'res.cloudinary.com', 'localhost:1337', '*'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (ctx) => {
        const origin = ctx.request.header.origin
        if (
          origin &&
          (
            origin === 'http://localhost:3000' ||
            origin === 'http://[::1]:3000' ||
            origin === 'http://localhost:3001' ||
            origin === 'http://localhost:3002' ||
            origin === 'http://localhost:3003' ||
            origin === 'http://localhost:3004' ||
            origin === 'http://localhost:3005' ||
            origin === 'http://localhost:1337' ||
            origin === 'http://127.0.0.1:3000' ||
            origin === 'http://127.0.0.1:3001' ||
            origin === 'https://bold-approval-5bde4fbd5d.strapiapp.com' ||
            origin === 'https://certo.netlify.app' ||
            origin === 'https://certo.schroedinger-hat.org' ||
            origin === 'https://certo-strapi.schroedinger-hat.org' ||
            /^https:\/\/deploy-preview-\d+--certo\.netlify\.app$/.test(origin)
          )
        ) {
          return origin
        }
        return false
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
      credentials: true,
    }
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
