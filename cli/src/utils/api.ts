import type { Config } from './config.js';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = unknown>(
  cfg: Config,
  method: string,
  pathname: string,
  body?: unknown,
): Promise<T> {
  const url = new URL(pathname, cfg.apiUrl).toString();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      (json as any)?.error?.message ||
      (json as any)?.message ||
      `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, json);
  }

  return json as T;
}
