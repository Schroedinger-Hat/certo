export interface DidWebDocument {
  id?: string
  verificationMethod?: Array<{ id?: string; [key: string]: unknown }> | { id?: string; [key: string]: unknown }
  [key: string]: unknown
}

export function didWebDocumentUrl(didUrl: string): string {
  const did = didUrl.split('#', 1)[0]
  if (!did.startsWith('did:web:')) {
    throw new Error('Not a did:web identifier')
  }

  const identifier = did.slice('did:web:'.length)
  const segments = identifier.split(':')
  const host = decodeURIComponent(segments.shift() || '')

  if (!host || host.includes('/') || host.includes('?') || host.includes('#')) {
    throw new Error('Invalid did:web host')
  }

  const path = segments.map(segment => {
    const decoded = decodeURIComponent(segment)
    if (!decoded || decoded === '.' || decoded === '..' || decoded.includes('/')) {
      throw new Error('Invalid did:web path')
    }
    return encodeURIComponent(decoded)
  })

  return path.length > 0
    ? `https://${host}/${path.join('/')}/did.json`
    : `https://${host}/.well-known/did.json`
}

export async function resolveDidWeb(
  didUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<DidWebDocument> {
  const response = await fetcher(didWebDocumentUrl(didUrl), {
    headers: { Accept: 'application/did+json, application/json' },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`DID document request failed with HTTP ${response.status}`)
  }

  return await response.json() as DidWebDocument
}