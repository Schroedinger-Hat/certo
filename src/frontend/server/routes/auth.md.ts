/**
 * GET /auth.md
 *
 * Auth.md — agent registration and authentication instructions.
 * https://workos.com/auth.md
 *
 * Returns text/markdown so agents can parse human-readable + machine-readable
 * registration guidance in one document.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return `# Auth Instructions for Certo

## Overview

Certo is an open-source platform for issuing and verifying Open Badges 3.0 and W3C Verifiable Credentials.

The API lives at \`https://certo.schroedinger-hat.org/api\`.
Public endpoints (e.g. \`GET /api/credentials/:id/verify\`) require no authentication.
Write endpoints require a Bearer token.

## Getting an API Token

1. Log in to the Certo admin panel at \`https://certo.schroedinger-hat.org/admin\`
2. Go to **Settings → API Tokens**
3. Click **Create new API Token**
4. Choose a name, expiry, and permission level (\`Full access\` or \`Custom\`)
5. Copy the token — it is shown only once

## Authentication

Pass the token in the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Token Endpoint (programmatic login)

Alternatively, obtain a short-lived JWT by posting user credentials:

\`\`\`
POST /api/auth/local
Content-Type: application/json

{ "identifier": "user@example.com", "password": "your-password" }
\`\`\`

Response includes \`jwt\` (use as Bearer token) and \`user\` details.

## Scopes

Certo uses Strapi role-based permissions. Common roles:

| Role | Can do |
|---|---|
| **Issuer** | issue, revoke, renew credentials; manage achievements |
| **Authenticated** | read credentials and achievements |
| **Public** | verify credentials (no token needed) |

## MCP Server

For AI agents, use the \`@certo/mcp\` MCP server instead of raw API calls.
See: \`/.well-known/mcp/server-card.json\`

\`\`\`json
{
  "mcpServers": {
    "certo": {
      "command": "npx",
      "args": ["-y", "@certo/mcp"],
      "env": {
        "CERTO_API_URL": "https://certo.schroedinger-hat.org",
        "CERTO_API_TOKEN": "YOUR_API_TOKEN"
      }
    }
  }
}
\`\`\`

## Resources

- OAuth Protected Resource Metadata: \`/.well-known/oauth-protected-resource\`
- OAuth AS Metadata: \`/.well-known/oauth-authorization-server\`
- API Catalog: \`/.well-known/api-catalog\`
- Agent Skills: \`/.well-known/agent-skills/index.json\`
- MCP Server Card: \`/.well-known/mcp/server-card.json\`
- OpenAPI: \`/api/documentation\`
`
})
