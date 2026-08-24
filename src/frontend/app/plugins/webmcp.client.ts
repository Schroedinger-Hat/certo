/**
 * WebMCP plugin — exposes Certo's key actions to AI agents via the browser's
 * navigator.modelContext API (Chrome origin trial / WebMCP spec).
 *
 * https://webmachinelearning.github.io/webmcp/
 * https://developer.chrome.com/blog/webmcp-epp
 *
 * Only runs in the browser (client-only). Gracefully no-ops in browsers
 * that don't support WebMCP yet.
 */
export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  // WebMCP is still in origin trial — check before calling
  const ctx = (navigator as any).modelContext
  if (typeof ctx?.provideContext !== 'function') return

  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl || ''

  ctx.provideContext({
    tools: [
      {
        name: 'verify_credential',
        description:
          'Verify an Open Badges 3.0 credential by its URN or ID. ' +
          'No authentication required. Returns validity status and per-check details.',
        inputSchema: {
          type: 'object',
          properties: {
            credential_id: {
              type: 'string',
              description: 'Credential URN (urn:uuid:...) or numeric ID',
            },
          },
          required: ['credential_id'],
        },
        async execute({ credential_id }: { credential_id: string }) {
          const res = await fetch(
            `${apiUrl}/api/credentials/${encodeURIComponent(credential_id)}/verify`,
          )
          return res.json()
        },
      },
      {
        name: 'list_achievements',
        description: 'List all available achievement / badge definitions in this Certo instance.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        async execute() {
          const res = await fetch(`${apiUrl}/api/achievements?status=published`)
          return res.json()
        },
      },
      {
        name: 'get_current_credential',
        description:
          'Get the full verification result for the credential currently visible on this page.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        execute() {
          // Returns the credential ID from the current URL if on a credential page
          const match = window.location.pathname.match(/\/credentials\/(.+)$/)
          if (!match) return { error: 'Not on a credential page' }
          return { credential_id: decodeURIComponent(match[1]!) }
        },
      },
    ],
  }).catch(() => {
    // Silently ignore if provideContext fails (e.g., not in origin trial)
  })
})
