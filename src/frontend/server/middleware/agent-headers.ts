/**
 * Agent discovery middleware
 *
 * 1. Link headers (RFC 8288 / RFC 9727 §3) on every response
 *    Points agents to the API catalog, MCP server card, agent skills index,
 *    and OpenAPI spec without requiring prior knowledge of URL structure.
 *
 * 2. Markdown for Agents (Content-Type negotiation)
 *    When a client sends Accept: text/markdown on the homepage (/),
 *    serves llms.txt instead of the full HTML page — a lightweight
 *    machine-readable description of the site for AI crawlers and agents.
 *    https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // ── 1. Link headers ─────────────────────────────────────────────────────
  // Append (don't replace) so other middleware can also set Link headers.
  const linkHeaders = [
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</api/documentation>; rel="service-doc"',
    '</api/documentation/v1.0.0/full_documentation.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
    '</.well-known/mcp.json>; rel="https://mcp.so/rel/server"',
    '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
    '</llms.txt>; rel="describedby"; type="text/plain"',
    '</.well-known/agent-skills/index.json>; rel="https://agentskills.io/rel/skills-index"',
    '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
    '</auth.md>; rel="https://workos.com/rel/auth"',
  ].join(', ')

  appendResponseHeader(event, 'Link', linkHeaders)

  // ── 2. Markdown for Agents ───────────────────────────────────────────────
  // Only on the homepage; only when the client explicitly accepts text/markdown.
  if (path === '/' || path === '') {
    const accept = getRequestHeader(event, 'accept') ?? ''
    if (accept.includes('text/markdown')) {
      // Serve llms.txt as the markdown representation of the homepage
      try {
        const llmsTxt = await useStorage('assets:public').getItemRaw('llms.txt')
        if (llmsTxt) {
          setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
          setResponseHeader(event, 'Vary', 'Accept')
          return llmsTxt
        }
      } catch {
        // Fall through to normal HTML rendering if llms.txt isn't available
      }
    }
  }
})
