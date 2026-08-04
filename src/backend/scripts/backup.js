#!/usr/bin/env node

/**
 * Full-instance backup: dumps the database (pg_dump for postgres, a plain
 * file copy for sqlite) and copies public/uploads, into one timestamped
 * directory. DB-native rather than a generic content-type JSON dump, so it
 * captures everything (admin users, roles, relations) byte-for-byte without
 * needing to reimplement relational integrity by hand. MySQL isn't
 * supported here - nothing in this repo's docker-compose/docs uses it.
 *
 * Deliberately does NOT boot a full Strapi instance (unlike
 * scripts/fresh-install.js) - a live app isn't needed to read connection
 * config, and for sqlite in particular we don't want to hold the DB file
 * open with our own connection while also reading it for backup. Instead
 * this reads the same env vars (and defaults) as config/database.ts
 * directly.
 *
 * See docs/self-hosting.md. Usage: npm run backup
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BACKEND_ROOT = path.join(__dirname, '..');
const BACKUPS_ROOT = path.join(BACKEND_ROOT, 'backups');
const UPLOADS_DIR = path.join(BACKEND_ROOT, 'public', 'uploads');

function getConnectionConfig() {
  const client = process.env.DATABASE_CLIENT || 'sqlite';

  if (client === 'postgres') {
    return {
      client,
      connectionString: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || '5432',
      database: process.env.DATABASE_NAME || 'strapi',
      user: process.env.DATABASE_USERNAME || 'strapi',
      password: process.env.DATABASE_PASSWORD || 'strapi',
    };
  }

  if (client === 'sqlite') {
    return {
      client,
      filename: path.join(BACKEND_ROOT, process.env.DATABASE_FILENAME || '.tmp/data.db'),
    };
  }

  throw new Error(`Unsupported DATABASE_CLIENT "${client}" - backup.js supports sqlite and postgres only`);
}

function timestampedDir() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(BACKUPS_ROOT, ts);
}

function backupPostgres(connection, outDir) {
  const dumpFile = path.join(outDir, 'db.dump');
  const args = ['--format=custom', '--file', dumpFile];
  const env = { ...process.env };

  if (connection.connectionString) {
    args.push(connection.connectionString);
  } else {
    args.push(
      '--host', connection.host,
      '--port', String(connection.port),
      '--username', connection.user,
      '--dbname', connection.database
    );
    env.PGPASSWORD = connection.password;
  }

  const result = spawnSync('pg_dump', args, { stdio: 'inherit', env });
  if (result.error) {
    throw new Error(`Could not run pg_dump - is the postgresql-client installed? (${result.error.message})`);
  }
  if (result.status !== 0) {
    throw new Error(`pg_dump exited with code ${result.status}`);
  }
  return dumpFile;
}

function backupSqlite(connection, outDir) {
  const dest = path.join(outDir, 'data.db');
  fs.copyFileSync(connection.filename, dest);
  return dest;
}

function copyUploads(outDir) {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('[Backup] No public/uploads directory found, skipping media backup');
    return null;
  }
  const dest = path.join(outDir, 'uploads');
  fs.cpSync(UPLOADS_DIR, dest, { recursive: true });
  return dest;
}

function runBackup() {
  try {
    const { client, ...connection } = getConnectionConfig();
    const outDir = timestampedDir();
    fs.mkdirSync(outDir, { recursive: true });

    console.log(`[Backup] Backing up ${client} database to ${outDir}...`);

    const dbBackupPath = client === 'postgres'
      ? backupPostgres(connection, outDir)
      : backupSqlite(connection, outDir);

    const uploadsPath = copyUploads(outDir);

    console.log('[Backup] Done.');
    console.log(`[Backup]   Database: ${dbBackupPath}`);
    console.log(`[Backup]   Uploads:  ${uploadsPath || '(none)'}`);
    console.log(`[Backup] Restore with: npm run restore -- --from ${outDir} --yes`);
  } catch (error) {
    console.error('[Backup] Failed:', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runBackup();
}

module.exports = { runBackup, getConnectionConfig };
