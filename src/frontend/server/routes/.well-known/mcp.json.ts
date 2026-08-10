/**
 * GET /.well-known/mcp.json
 *
 * Machine-readable MCP server discovery file.
 * AI tools and agent frameworks can GET this URL to discover the
 * @certo/mcp server and how to configure it.
 *
 * Similar pattern to /.well-known/openid-configuration for OIDC.
 */
export default defineEventHandler(() => ({
  // serverInfo required by MCP Server Card spec (SEP-1649)
  serverInfo: {
    name: 'certo',
    version: '0.1.0',
    description: 'Open-source platform for issuing and verifying Open Badges 3.0 / Verifiable Credentials',
  },
  // Legacy top-level name field (backward compat)
  name: 'Certo',
  mcp_server: {
    package: '@certo/mcp',
    install: 'npx -y @certo/mcp',
    version: '0.1.0',
    transport: 'stdio',
    configuration: {
      required: [],
      optional: [
        {
          env: 'CERTO_API_URL',
          description: 'Base URL of your Certo backend',
          default: 'http://localhost:1337',
        },
        {
          env: 'CERTO_API_TOKEN',
          description: 'Strapi API token — required for write operations',
        },
      ],
    },
    tools: [
      { name: 'verify_credential',      auth: false,  description: 'Verify a credential by URN or ID' },
      { name: 'list_achievements',      auth: false,  description: 'List available badge definitions' },
      { name: 'get_credential',         auth: false,  description: 'Get full credential details' },
      { name: 'list_credentials',       auth: true,   description: 'List credentials for the authenticated user' },
      { name: 'issue_credential',       auth: true,   description: 'Issue a credential to a recipient' },
      { name: 'revoke_credential',      auth: true,   description: 'Revoke a credential' },
      { name: 'renew_credential',       auth: true,   description: 'Renew a credential with a new expiry' },
      { name: 'run_expiration_check',   auth: true,   description: 'Trigger expiration notification scan' },
      { name: 'export_profile_data',    auth: true,   description: 'Export all profile data' },
    ],
  },
  api: {
    base_url: 'https://certo.schroedinger-hat.org/api',
    openapi: 'https://certo.schroedinger-hat.org/api/documentation',
    health: 'https://certo.schroedinger-hat.org/api/health',
  },
  source: 'https://github.com/Schroedinger-Hat/certo',
  license: 'MIT',
}))
