# Self-Hosting

Notes specific to deploying Certo on your own domain, distilled from a real
deployment attempt
([issue #78](https://github.com/Schroedinger-Hat/certo/issues/78)) that
surfaced three bugs blocking any self-hosted instance — now fixed (see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md#self-hosting)
for the full writeup of each):

- [#75](https://github.com/Schroedinger-Hat/certo/issues/75) — CORS crashed on any origin not in the hardcoded whitelist.
- [#76](https://github.com/Schroedinger-Hat/certo/issues/76) — `/api/users/me?populate=*` 403'd, breaking role-based frontend logic.
- [#77](https://github.com/Schroedinger-Hat/certo/issues/77) — the frontend's issuer check relied on a Strapi role that can never exist.

## CORS: allow your own domain

`config/middlewares.ts` allows a hardcoded set of localhost/Netlify/
schroedinger-hat.org origins by default. Add your own via the
`CORS_ALLOWED_ORIGINS` env var (comma-separated, no spaces needed but
tolerated):

```bash
CORS_ALLOWED_ORIGINS=https://badges.example.org,https://api.badges.example.org
```

Set this to both your frontend and backend origins if they're on different
subdomains — the backend needs to allow the frontend's origin for browser
requests, and the admin panel needs to allow its own origin too.

## Change the default admin credentials

`admin@certo.com` / `certo` are seeded automatically by
`bootstrap/seed-data.ts` on first boot, and are documented in the root
[README](../README.md) for local dev convenience. Seeding only skips itself
when `NODE_ENV` is explicitly set to `production` — if your deployment
doesn't set that, these credentials will be created on your instance too.

**Change the password immediately** if your instance is reachable by anyone
but you. The backend logs a warning on every boot if this account still has
its default password (`bootstrap/default-credentials-warning.ts`) — don't
ignore it.

## Uploaded media persistence

`docker-compose.yml`'s `backend` service previously had **no volume at all**
for `public/uploads` — every container recreation (a plain restart included,
depending on how your host handles container replacement) silently deleted
every uploaded achievement/profile image. Fixed by adding a named
`uploads-data` volume mounted at `/app/public/uploads`. If you deployed
before this fix, any existing uploads are already gone; nothing to migrate,
just make sure you're on the current `docker-compose.yml`.

### Or skip local disk entirely: S3-compatible storage

Set `UPLOAD_PROVIDER=s3` to store uploads in a bucket instead of
`public/uploads` — works with real AWS S3 or any S3-compatible service
(MinIO, Cloudflare R2, etc. — set `S3_ENDPOINT` and `S3_FORCE_PATH_STYLE=true`
for those; leave both unset for real AWS):

```bash
UPLOAD_PROVIDER=s3
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=us-east-1
S3_BUCKET=your-bucket
# Only for non-AWS S3-compatible services:
S3_ENDPOINT=https://minio.example.org
S3_FORCE_PATH_STYLE=true
```

This is the only realistic option once you're running more than one backend
instance (e.g. `backend.replicaCount > 1` in the [Helm chart](./kubernetes.md))
— a local-disk PVC/volume can't be safely shared across multiple instances,
a bucket can. Verified end-to-end against a local MinIO container: uploaded
a file through Strapi's own upload API, confirmed the object actually landed
in the bucket and the returned URL served the exact uploaded content back.

## Backup / restore

`npm run backup` (run inside the backend container/host) dumps the database
and `public/uploads` into a timestamped directory under `backups/`:
- Postgres: `pg_dump --format=custom` (the Docker image now includes
  `postgresql16-client` for this — see `Dockerfile`).
- SQLite (local dev): a plain file copy of `DATABASE_FILENAME`.
- MySQL is **not** supported by this script — nothing in this repo's
  docker-compose/docs uses it.

```bash
docker exec certo_backend npm run backup
```

Restore is destructive (it replaces the current database and uploads
outright), so it requires an explicit `--yes` and refuses to run without it.
Stop the app first if you can, especially for SQLite, so nothing else has
the DB file open:

```bash
docker exec certo_backend npm run restore -- --from backups/<timestamp> --yes
```

Neither script boots a full Strapi instance — they read the same
`DATABASE_*` env vars `config/database.ts` uses and operate on the DB/
filesystem directly, so restore doesn't fight your own app for a lock on the
file it's about to replace.

## Take your own data with you

Separately from the full-instance backup above, any logged-in issuer can
export just their own data (achievements they created, credentials they
issued or received, and evidence) as JSON, and re-import it into a fresh
instance under the same account:

```bash
curl -H "Authorization: Bearer $TOKEN" https://your-instance/api/profiles/me/export > my-data.json

curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @my-data.json https://your-instance/api/profiles/me/import
```

Import is idempotent (skips anything that already exists, matched by its
natural key) and never touches credentials merely *received* by that
profile — see `src/backend/src/api/profile/services/data-portability.ts`.

## Webhook delivery and retries

Webhooks are delivered asynchronously via an Event Bus, decoupling the issuing
endpoint (e.g. `POST /credentials/batch-issue`) from the actual HTTP calls to
subscribed endpoints. This means:

- Credential issuance returns immediately, even if a webhook endpoint is slow
  or down.
- Failed deliveries are retried automatically with exponential backoff (1s,
  2s, 4s) up to 3 times.
- One subscriber's failure does not prevent delivery to other subscribers.

The Event Bus is configured via `EVENT_BUS_PROVIDER`:

- `memory` (default): In-process queue, suitable for dev and single-instance
  deployments. No persistence — if the server restarts, in-flight events are lost.
- `redis` (production): Redis Streams backend, messages persisted in Redis,
  durable across restarts. Requires `ioredis` package and a Redis instance.
  Recommended for multi-replica deployments.

To use Redis:

```bash
EVENT_BUS_PROVIDER=redis
EVENT_BUS_REDIS_HOST=redis.example.org
EVENT_BUS_REDIS_PORT=6379
EVENT_BUS_REDIS_PASSWORD=...
EVENT_BUS_REDIS_DB=0
```

If `EVENT_BUS_PROVIDER` is unset or empty, defaults to `memory`. See
[backend.md](./backend.md#event-bus) for technical details.

## Monitoring and logging

`/api/health` and `/api/metrics` (Prometheus) are available — see
[monitoring.md](./monitoring.md). Structured JSON logging with per-request
correlation (`LOG_FORMAT_JSON`) is available — see [logging.md](./logging.md).

## Beyond docker-compose: Kubernetes and reverse proxies

- A Helm chart ([`helm/certo/`](../helm/certo/)) mirrors docker-compose's
  services/env vars for a Kubernetes deployment — see
  [kubernetes.md](./kubernetes.md).
- Nginx/Caddy/Traefik examples for terminating TLS in front of the
  docker-compose stack — see [reverse-proxy.md](./reverse-proxy.md).

## Everything else

For the general architecture, deployment topology, and the rest of the
backend/frontend config surface, start with
[architecture.md](./architecture.md) and [backend.md](./backend.md). This doc
only covers the self-hosting-specific gotchas above — it isn't a full
production-readiness checklist (see [security.md](./security.md) for what's
explicitly *not* handled yet, e.g. HTTPS termination and GDPR are left to
you; backups are now covered above).
