# @certo/mcp

MCP server for the [Certo](https://github.com/Schroedinger-Hat/certo) credential platform.

Lets AI assistants (Claude Desktop, Cursor, GitHub Copilot, etc.) issue, verify, and manage
Open Badges 3.0 / Verifiable Credentials via natural language.

## Tools

| Tool | Description | Auth required |
|---|---|---|
| `verify_credential` | Verify a credential by URN or ID | No |
| `list_achievements` | List available badge definitions | No |
| `list_credentials` | List credentials for the authenticated user | Yes |
| `issue_credential` | Issue a credential to a recipient | Yes |
| `revoke_credential` | Revoke a credential | Yes |
| `renew_credential` | Renew a credential with a new expiry date | Yes |
| `get_credential` | Get full credential details + verification | No |
| `run_expiration_check` | Trigger expiration notification scan | Yes (admin) |
| `export_profile_data` | Export all profile data | Yes |

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "certo": {
      "command": "npx",
      "args": ["-y", "@certo/mcp"],
      "env": {
        "CERTO_API_URL": "https://your-certo.example.com",
        "CERTO_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP config (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "certo": {
      "command": "npx",
      "args": ["-y", "@certo/mcp"],
      "env": {
        "CERTO_API_URL": "https://your-certo.example.com",
        "CERTO_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "certo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@certo/mcp"],
      "env": {
        "CERTO_API_URL": "https://your-certo.example.com",
        "CERTO_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Configuration

| Variable | Description | Default |
|---|---|---|
| `CERTO_API_URL` | Base URL of your Certo backend | `http://localhost:1337` |
| `CERTO_API_TOKEN` | Strapi API token | _(empty — only public tools work)_ |

To generate an API token: Certo admin panel → Settings → API Tokens → Create.

## Example prompts

```
"Verify credential urn:uuid:abc123"

"List all available achievements"

"Issue the 'Web Development' badge to alice@example.com, expiring 2027-12-31"

"Revoke credential 42 — reason: employee left the company"

"Show me all expired credentials"

"Run the expiration notification check"
```

## Development

```bash
cd mcp
npm install
npm run dev     # run via tsx (no build needed)
npm run build   # compile to dist/
```
