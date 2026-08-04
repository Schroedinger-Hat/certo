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

## Everything else

For the general architecture, deployment topology, and the rest of the
backend/frontend config surface, start with
[architecture.md](./architecture.md) and [backend.md](./backend.md). This doc
only covers the self-hosting-specific gotchas above — it isn't a full
production-readiness checklist (see [security.md](./security.md) for what's
explicitly *not* handled yet, e.g. HTTPS termination and GDPR/backups are
left to you).
