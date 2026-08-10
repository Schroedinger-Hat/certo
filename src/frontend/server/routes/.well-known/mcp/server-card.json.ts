/**
 * GET /.well-known/mcp/server-card.json
 *
 * MCP Server Card per SEP-1649.
 * https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
 *
 * Advertises the @certo/mcp server, its transport, and its capabilities
 * so agent frameworks can auto-configure without reading a README.
 */
export default defineEventHandler(() => ({
  serverInfo: {
    name: 'certo',
    version: '0.1.0',
    description: 'Open-source platform for issuing and verifying Open Badges 3.0 / Verifiable Credentials',
  },
  transport: {
    // npx-invocable stdio server — the primary transport for local AI assistants
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@certo/mcp'],
    // configuration via env vars
    env: {
      CERTO_API_URL: 'https://certo.schroedinger-hat.org',
      CERTO_API_TOKEN: '(required for write operations)',
    },
  },
  capabilities: {
    tools: {
      list: [
        { name: 'verify_credential',    auth: false },
        { name: 'list_achievements',    auth: false },
        { name: 'get_credential',       auth: false },
        { name: 'list_credentials',     auth: true  },
        { name: 'issue_credential',     auth: true  },
        { name: 'revoke_credential',    auth: true  },
        { name: 'renew_credential',     auth: true  },
        { name: 'run_expiration_check', auth: true  },
        { name: 'export_profile_data',  auth: true  },
      ],
    },
  },
  links: {
    source: 'https://github.com/Schroedinger-Hat/certo',
    docs: 'https://github.com/Schroedinger-Hat/certo/tree/main/mcp',
    package: 'https://www.npmjs.com/package/@certo/mcp',
    agentSkills: 'https://certo.schroedinger-hat.org/.well-known/agent-skills/index.json',
  },
}))
