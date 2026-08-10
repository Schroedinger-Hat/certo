#!/usr/bin/env node
// Thin shebang wrapper — compiled output lives in dist/
import('../dist/index.js').catch(err => {
  console.error('certo: failed to load —', err.message);
  console.error('Run `npm run build` inside the cli/ directory first.');
  process.exitCode = 1;
});
