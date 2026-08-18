import { CertoClient, CertoApiError } from './index.js';
import type { AuthResponse, StrapiListResponse, Credential, VerifyResult } from './index.js';

// ──────────────────────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────────────────────

function makeFetch(status: number, body: unknown): typeof globalThis.fetch {
  return async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }) as Response;
}

function captureFetch(): {
  calls: Array<{ url: string; init: RequestInit | undefined }>;
  fetch: typeof globalThis.fetch;
  setNext: (status: number, body: unknown) => void;
} {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  let nextStatus = 200;
  let nextBody: unknown = {};

  const fetch: typeof globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(nextBody), {
      status: nextStatus,
      headers: { 'Content-Type': 'application/json' },
    }) as Response;
  };

  return {
    calls,
    fetch,
    setNext(status, body) {
      nextStatus = status;
      nextBody = body;
    },
  };
}

// ──────────────────────────────────────────────────────────────
// CertoApiError
// ──────────────────────────────────────────────────────────────

describe('CertoApiError', () => {
  it('is thrown on non-2xx responses', async () => {
    const client = new CertoClient({
      baseUrl: 'http://localhost:1337',
      fetch: makeFetch(401, { error: { message: 'Invalid credentials' } }),
    });

    await expect(
      client.auth.login({ identifier: 'bad@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      name: 'CertoApiError',
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('falls back to HTTP status message when no body message', async () => {
    const client = new CertoClient({
      baseUrl: 'http://localhost:1337',
      fetch: makeFetch(500, null),
    });

    await expect(client.profiles.me()).rejects.toMatchObject({
      name: 'CertoApiError',
      statusCode: 500,
      message: 'HTTP 500',
    });
  });
});

// ──────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────

describe('auth.login', () => {
  it('sends credentials and stores JWT', async () => {
    const spy = captureFetch();
    const authResp: AuthResponse = {
      jwt: 'test-jwt-token',
      user: { id: 1, username: 'admin', email: 'admin@example.com', blocked: false, confirmed: true },
    };
    spy.setNext(200, authResp);

    const client = new CertoClient({ baseUrl: 'http://localhost:1337', fetch: spy.fetch });
    const res = await client.auth.login({ identifier: 'admin@example.com', password: 'secret' });

    expect(res.jwt).toBe('test-jwt-token');
    expect(spy.calls).toHaveLength(1);
    expect(spy.calls[0]!.url).toBe('http://localhost:1337/api/auth/local');

    // Subsequent request should carry the JWT
    spy.setNext(200, { data: [] });
    await client.credentials.list();
    const authHeader = (spy.calls[1]!.init?.headers as Record<string, string>)?.['Authorization'];
    expect(authHeader).toBe('Bearer test-jwt-token');
  });

  it('clears token on logout', async () => {
    const spy = captureFetch();
    spy.setNext(200, { jwt: 'tok', user: {} });
    const client = new CertoClient({ baseUrl: 'http://localhost:1337', fetch: spy.fetch });
    await client.auth.login({ identifier: 'a@b.com', password: 'p' });

    client.auth.logout();

    spy.setNext(200, { data: [] });
    await client.credentials.list();
    const authHeader = (spy.calls[1]!.init?.headers as Record<string, string>)?.['Authorization'];
    expect(authHeader).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────
// Credentials
// ──────────────────────────────────────────────────────────────

describe('credentials.list', () => {
  it('builds pagination query string', async () => {
    const spy = captureFetch();
    spy.setNext(200, { data: [], meta: {} });
    const client = new CertoClient({ fetch: spy.fetch });
    await client.credentials.list({ page: 2, pageSize: 10 });

    expect(spy.calls[0]!.url).toContain('pagination%5Bpage%5D=2');
    expect(spy.calls[0]!.url).toContain('pagination%5BpageSize%5D=10');
  });
});

describe('credentials.verify', () => {
  it('encodes URN in the path and returns result', async () => {
    const verifyResult: VerifyResult = { verified: true, checks: [] };
    const spy = captureFetch();
    spy.setNext(200, verifyResult);
    const client = new CertoClient({ fetch: spy.fetch });

    const res = await client.credentials.verify('urn:uuid:abc-123');

    expect(res.verified).toBe(true);
    expect(spy.calls[0]!.url).toContain('urn%3Auuid%3Aabc-123');
  });
});

describe('credentials.validateExternal', () => {
  it('posts an external credential without requiring authentication', async () => {
    const result: VerifyResult = { verified: true, checks: [] };
    const credential = {
      id: 'urn:uuid:external-123',
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
    };
    const spy = captureFetch();
    spy.setNext(200, result);
    const client = new CertoClient({ fetch: spy.fetch });

    const response = await client.credentials.validateExternal(credential);

    expect(response.verified).toBe(true);
    expect(spy.calls[0]!.url).toContain('/api/credentials/validate');
    expect(spy.calls[0]!.init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(spy.calls[0]!.init?.body as string)).toEqual({ credential });
  });
});

describe('credentials.issue', () => {
  it('posts the correct body shape', async () => {
    const spy = captureFetch();
    spy.setNext(200, { credential: {} });
    const client = new CertoClient({ fetch: spy.fetch });

    await client.credentials.issue({
      achievementId: 5,
      recipientEmail: 'alice@example.com',
      recipientName: 'Alice',
    });

    const body = JSON.parse(spy.calls[0]!.init?.body as string);
    expect(body.achievement).toBe(5);
    expect(body.recipient.email).toBe('alice@example.com');
    expect(body.recipient.name).toBe('Alice');
  });
});

describe('credentials.batchIssue', () => {
  it('sends correct batch payload', async () => {
    const spy = captureFetch();
    spy.setNext(200, { credentials: [], errors: [] });
    const client = new CertoClient({ fetch: spy.fetch });

    await client.credentials.batchIssue({
      achievementId: 1,
      recipients: [
        { email: 'a@example.com', name: 'A' },
        { email: 'b@example.com' },
      ],
    });

    const body = JSON.parse(spy.calls[0]!.init?.body as string);
    expect(body.achievement).toBe(1);
    expect(body.recipients).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────
// setToken convenience
// ──────────────────────────────────────────────────────────────

describe('CertoClient.setToken', () => {
  it('applies the token to subsequent requests', async () => {
    const spy = captureFetch();
    spy.setNext(200, { data: [] });
    const client = new CertoClient({ fetch: spy.fetch });
    client.setToken('my-api-key');

    await client.credentials.list();
    const authHeader = (spy.calls[0]!.init?.headers as Record<string, string>)?.['Authorization'];
    expect(authHeader).toBe('Bearer my-api-key');
  });
});

// ──────────────────────────────────────────────────────────────
// Scheduled
// ──────────────────────────────────────────────────────────────

describe('scheduled.create', () => {
  it('maps achievementId to achievement relation', async () => {
    const spy = captureFetch();
    spy.setNext(200, { data: {}, meta: {} });
    const client = new CertoClient({ fetch: spy.fetch });

    await client.scheduled.create({
      achievementId: 2,
      recipientEmail: 'bob@example.com',
      scheduledFor: '2026-12-31T00:00:00.000Z',
    });

    const body = JSON.parse(spy.calls[0]!.init?.body as string);
    expect(body.data.achievement).toBe(2);
    expect(body.data.scheduledFor).toBe('2026-12-31T00:00:00.000Z');
  });
});
