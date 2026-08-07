/**
 * Tests for the certo CLI script
 * Covers the pure/testable parts: argument parsing and config resolution.
 * Live API commands require a running backend and are tested manually.
 */

const { parseArgs, getConfig } = require('../certo');

describe('certo CLI', () => {
  describe('parseArgs', () => {
    it('should parse a single positional arg', () => {
      const result = parseArgs(['verify', 'urn:uuid:abc']);
      expect(result._).toEqual(['verify', 'urn:uuid:abc']);
      expect(result.flags).toEqual({});
    });

    it('should parse flags with values', () => {
      const result = parseArgs(['issue', '--achievement', '1', '--recipient', 'alice@example.com']);
      expect(result._).toEqual(['issue']);
      expect(result.flags.achievement).toBe('1');
      expect(result.flags.recipient).toBe('alice@example.com');
    });

    it('should parse boolean flags', () => {
      const result = parseArgs(['list', '--json', '--quiet']);
      expect(result._).toEqual(['list']);
      expect(result.flags.json).toBe(true);
      expect(result.flags.quiet).toBe(true);
    });

    it('should parse mixed positional args and flags', () => {
      const result = parseArgs(['revoke', '42', '--reason', 'Role change']);
      expect(result._).toEqual(['revoke', '42']);
      expect(result.flags.reason).toBe('Role change');
    });

    it('should parse --yes flag correctly', () => {
      const result = parseArgs(['restore', '--from', '/backups/2026', '--yes']);
      expect(result._).toEqual(['restore']);
      expect(result.flags.from).toBe('/backups/2026');
      expect(result.flags.yes).toBe(true);
    });

    it('should return empty arrays for no args', () => {
      const result = parseArgs([]);
      expect(result._).toEqual([]);
      expect(result.flags).toEqual({});
    });
  });

  describe('getConfig', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      Object.keys(process.env).forEach(k => {
        if (!(k in originalEnv)) delete process.env[k];
        else process.env[k] = originalEnv[k];
      });
    });

    it('should use defaults when no env or flags set', () => {
      delete process.env.CERTO_API_URL;
      delete process.env.CERTO_API_TOKEN;

      const cfg = getConfig({});
      expect(cfg.apiUrl).toBe('http://localhost:1337');
      expect(cfg.token).toBe('');
    });

    it('should use env vars when set', () => {
      process.env.CERTO_API_URL = 'https://certo.example.com';
      process.env.CERTO_API_TOKEN = 'my-token-123';

      const cfg = getConfig({});
      expect(cfg.apiUrl).toBe('https://certo.example.com');
      expect(cfg.token).toBe('my-token-123');
    });

    it('should prefer flags over env vars', () => {
      process.env.CERTO_API_URL = 'https://env-url.example.com';
      process.env.CERTO_API_TOKEN = 'env-token';

      const cfg = getConfig({ url: 'https://flag-url.example.com', token: 'flag-token' });
      expect(cfg.apiUrl).toBe('https://flag-url.example.com');
      expect(cfg.token).toBe('flag-token');
    });

    it('should mix env and flag independently', () => {
      process.env.CERTO_API_URL = 'https://certo.example.com';
      delete process.env.CERTO_API_TOKEN;

      const cfg = getConfig({ token: 'cli-token' });
      expect(cfg.apiUrl).toBe('https://certo.example.com');
      expect(cfg.token).toBe('cli-token');
    });
  });
});
