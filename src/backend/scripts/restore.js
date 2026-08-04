#!/usr/bin/env node

/**
 * Full-instance restore from a directory produced by scripts/backup.js.
 * Destructive: postgres restore uses `pg_restore --clean --if-exists`,
 * which drops existing objects before recreating them; sqlite restore
 * overwrites the live DB file outright. Requires --yes for exactly that
 * reason - stop the app first (especially for sqlite, so nothing else has
 * the file open) and only pass --yes once you're sure.
 *
 * See docs/self-hosting.md.
 * Usage: npm run restore -- --from <backup-dir> --yes
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getConnectionConfig } = require('./backup');

const BACKEND_ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(BACKEND_ROOT, 'public', 'uploads');

function parseArgs(argv) {
  const args = { yes: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--from') args.from = argv[++i];
    else if (argv[i] === '--yes') args.yes = true;
  }
  return args;
}

function restorePostgres(connection, dumpFile) {
  const args = ['--clean', '--if-exists'];
  const env = { ...process.env };

  if (connection.connectionString) {
    args.push('--dbname', connection.connectionString);
  } else {
    args.push(
      '--host', connection.host,
      '--port', String(connection.port),
      '--username', connection.user,
      '--dbname', connection.database
    );
    env.PGPASSWORD = connection.password;
  }
  args.push(dumpFile);

  const result = spawnSync('pg_restore', args, { stdio: 'inherit', env });
  if (result.error) {
    throw new Error(`Could not run pg_restore - is the postgresql-client installed? (${result.error.message})`);
  }
  if (result.status !== 0) {
    throw new Error(`pg_restore exited with code ${result.status}`);
  }
}

function restoreSqlite(connection, dataFile) {
  fs.copyFileSync(dataFile, connection.filename);
}

function restoreUploads(fromDir) {
  const src = path.join(fromDir, 'uploads');
  if (!fs.existsSync(src)) {
    console.log('[Restore] No uploads/ in backup, skipping media restore');
    return;
  }
  fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
  fs.cpSync(src, UPLOADS_DIR, { recursive: true });
}

function runRestore() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.from) {
    console.error('[Restore] Usage: npm run restore -- --from <backup-dir> --yes');
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(args.from)) {
    console.error(`[Restore] Backup directory not found: ${args.from}`);
    process.exitCode = 1;
    return;
  }

  if (!args.yes) {
    console.error(
      '[Restore] Refusing to proceed without --yes: this REPLACES the current ' +
      'database (and public/uploads) with the contents of the backup. Stop the ' +
      'app first, confirm this is the right backup directory, then re-run with --yes.'
    );
    process.exitCode = 1;
    return;
  }

  try {
    const { client, ...connection } = getConnectionConfig();
    console.log(`[Restore] Restoring ${client} database from ${args.from}...`);

    if (client === 'postgres') {
      restorePostgres(connection, path.join(args.from, 'db.dump'));
    } else {
      restoreSqlite(connection, path.join(args.from, 'data.db'));
    }

    restoreUploads(args.from);

    console.log('[Restore] Done.');
  } catch (error) {
    console.error('[Restore] Failed:', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runRestore();
}

module.exports = { runRestore };
