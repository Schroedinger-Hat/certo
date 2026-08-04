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

## Monitoring

`/api/health` and `/api/metrics` (Prometheus) are now available — see
[monitoring.md](./monitoring.md).

## Everything else

For the general architecture, deployment topology, and the rest of the
backend/frontend config surface, start with
[architecture.md](./architecture.md) and [backend.md](./backend.md). This doc
only covers the self-hosting-specific gotchas above — it isn't a full
production-readiness checklist (see [security.md](./security.md) for what's
explicitly *not* handled yet, e.g. HTTPS termination and GDPR are left to
you; backups are now covered above).
