// Minimal CJS shim — bundles the ESM output into a CommonJS file using dynamic import
// so callers that use require('@certo/sdk') get the full module.
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const esmEntry = resolve(__dirname, '../dist/index.js');
const cjsEntry = resolve(__dirname, '../dist/index.cjs');

// Read the ESM entry and find every named export
const src = readFileSync(esmEntry, 'utf8');
const names = [...src.matchAll(/^export\s+(?:class|function|const|type|interface)\s+(\w+)/gm)]
  .map(m => m[1])
  .filter(Boolean);

// Build a tiny CJS wrapper
const cjs = `'use strict';
// Auto-generated CJS wrapper for @certo/sdk
Object.defineProperty(exports, '__esModule', { value: true });
const _mod = require('./index.js');
${names.map(n => `Object.defineProperty(exports, '${n}', { enumerable: true, get() { return _mod.${n}; } });`).join('\n')}
`;

writeFileSync(cjsEntry, cjs);
console.log('CJS shim written to dist/index.cjs');
