/**
 * GET /.well-known/oauth-protected-resource
 *
 * OAuth 2.0 Protected Resource Metadata per RFC 9728.
 * Tells agents which authorization server issues tokens for Certo's API.
 * https://www.rfc-editor.org/rfc/rfc9728
 */
export default defineEventHandler(() => ({
  resource: 'https://certo.schroedinger-hat.org/api',
  authorization_servers: [
    'https://certo.schroedinger-hat.org',
  ],
  // Strapi uses bearer tokens — API tokens or user JWTs
  bearer_methods_supported: ['header'],
  scopes_supported: [
    'credential:read',
    'credential:write',
    'credential:revoke',
    'achievement:read',
    'achievement:write',
    'profile:read',
    'profile:export',
  ],
  resource_documentation: 'https://certo.schroedinger-hat.org/api/documentation',
  resource_signing_alg_values_supported: ['HS256', 'RS256'],
}))
