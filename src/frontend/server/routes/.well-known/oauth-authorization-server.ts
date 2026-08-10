/**
 * GET /.well-known/oauth-authorization-server
 *
 * OAuth 2.0 Authorization Server Metadata per RFC 8414.
 * Strapi provides JWT-based authentication; this describes the token endpoint
 * so agents can programmatically discover how to obtain API tokens.
 * https://www.rfc-editor.org/rfc/rfc8414
 */
export default defineEventHandler(() => ({
  issuer: 'https://certo.schroedinger-hat.org',
  authorization_endpoint: 'https://certo.schroedinger-hat.org/api/connect/authorize',
  token_endpoint: 'https://certo.schroedinger-hat.org/api/auth/local',
  token_endpoint_auth_methods_supported: ['client_secret_post'],
  grant_types_supported: ['password', 'authorization_code'],
  response_types_supported: ['token'],
  // Admin panel token creation
  token_management_endpoint: 'https://certo.schroedinger-hat.org/admin/settings/api-tokens',
  // Agent registration via auth.md
  registration_endpoint: 'https://certo.schroedinger-hat.org/auth.md',
  scopes_supported: [
    'credential:read',
    'credential:write',
    'credential:revoke',
    'achievement:read',
    'achievement:write',
    'profile:read',
    'profile:export',
  ],
  service_documentation: 'https://certo.schroedinger-hat.org/api/documentation',
  // Agent-specific extension (auth.md spec)
  agent_auth: {
    register_uri: 'https://certo.schroedinger-hat.org/auth.md',
    supported_identity_types: ['api-key'],
    credential_types: ['bearer'],
  },
}))
