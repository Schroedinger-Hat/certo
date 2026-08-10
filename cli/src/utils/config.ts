import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Load .env from cli/../src/backend/.env if present, for developer convenience */
function loadDotenv() {
  const candidates = [
    join(__dirname, '../../src/backend/.env'),
    join(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      readFileSync(p, 'utf-8').split('\n').forEach(line => {
        const m = line.match(/^([^#=\s]+)=(.*)$/);
        if (m && !process.env[m[1]!]) {
          process.env[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, '');
        }
      });
      break;
    }
  }
}

export interface Config {
  apiUrl: string;
  token: string;
}

let _loaded = false;

export function getConfig(flags: Record<string, string | boolean> = {}): Config {
  if (!_loaded) {
    loadDotenv();
    _loaded = true;
  }
  return {
    apiUrl: (flags['url'] as string) || process.env['CERTO_API_URL'] || 'http://localhost:1337',
    token: (flags['token'] as string) || process.env['CERTO_API_TOKEN'] || '',
  };
}
