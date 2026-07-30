# Architecture

## Repo layout

Certo is **not** a package-manager monorepo — there's no root `package.json` and no
npm/pnpm/yarn workspaces. It's two independently-managed Node apps living side by
side under `src/`, tied together only by `docker-compose.yml`:

```
certo/
├── ROADMAP.md, README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md
├── docker-compose.yml            # postgres + mailhog + backend + frontend
├── ed25519-private.pem / ed25519-public.pem   # dev signing key (see known-issues)
├── docs/                         # this folder
├── scripts/                      # fresh-install.sh, test-fresh-install.js
├── netlify/functions/og-credential/   # standalone Netlify Function, own package.json
└── src/
    ├── backend/     # Strapi 5 (TypeScript) — own package.json + lockfile
    └── frontend/    # Nuxt 3 / Vue 3 — own package.json + lockfile
```

Each app is installed and run independently:

```bash
cd src/backend  && npm install && npm run develop
cd src/frontend && npm install && npm run dev
```

There are also two empty, unused scaffold directories nested at
`src/frontend/src/frontend/` and `src/frontend/src/frontend-una/` — leftovers from
project setup, not referenced by `nuxt.config.ts`. Safe to ignore (or clean up).

## High-level component diagram

```
┌─────────────────────┐        REST (fetch)        ┌──────────────────────────┐
│  Nuxt 3 frontend     │ ───────────────────────────▶│  Strapi 5 backend        │
│  (Vue 3 + Pinia)     │◀─────────────────────────── │  (content API + custom   │
│                      │        JSON / JWT            │   controllers/services)  │
└──────────┬───────────┘                              └──────────┬───────────────┘
           │ one Nitro server route proxies                      │
           │ POST /api/credentials/issue → backend                │
           ▼                                                      ▼
   (browser calls Strapi                                  Postgres / SQLite
    directly for almost                                   (via Strapi's query
    everything else)                                       engine, no separate ORM)
                                                                   │
                                                                   ▼
                                                        Strapi email plugin
                                                        (nodemailer → SMTP)
```

Most frontend → backend calls go **directly from the browser** to Strapi
(`NUXT_PUBLIC_API_URL`), not through a Nuxt server API. The one exception is
`server/api/credentials/issue.ts`, a Nitro/h3 route that proxies
`POST /api/credentials/issue` to Strapi while attaching the bearer token
server-side. There is no broader backend-for-frontend layer — this proxy route is
the only one.

## Data flow: issuing a credential

1. Frontend calls `ApiClient.issueBadge(...)` → `POST /api/credentials/issue` (proxied through the Nitro route above).
2. Strapi's `credential` controller/service (`src/backend/src/api/credential/services/credential.ts`):
   - finds-or-creates a `profile` for the recipient by email,
   - finds-or-creates a `users-permissions` **user** account for that profile (random password) so the recipient can log into the frontend later,
   - generates a `credentialId` (`urn:uuid:...`),
   - signs the payload with Ed25519/JWS (`generateProof`),
   - persists the `credential` row with the `proof` component attached,
   - serializes it to an OBv3 JSON object (`open-badge.ts`'s `serializeCredential`),
   - sends an email to the recipient via Strapi's `email` plugin.
3. Response includes the Strapi `credential` record **and** the serialized OBv3 JSON.

See [strapi-and-credentials.md](./strapi-and-credentials.md) for the full breakdown
of this flow, including the email/notification path and its current bugs.

## Deployment topology

The repo ships a **Docker Compose** setup (Postgres 16 + Mailhog + backend +
frontend) intended for local dev / self-hosting. But the actual **production**
deployment is inferred from the CORS allow-list in
`src/backend/config/middlewares.ts` and the Netlify function's default API URL —
it's PaaS-hosted, not the Docker Compose stack:

- **Frontend**: Netlify (`certo.netlify.app`, custom domain `certo.schroedinger-hat.org`), including Netlify deploy-preview URLs.
- **Backend**: Strapi Cloud (`bold-approval-5bde4fbd5d.strapiapp.com`) and/or a custom-domain backend (`certo-strapi.schroedinger-hat.org`).
- **OG image generation**: a standalone Netlify Function (`netlify/functions/og-credential/`) using `satori`, called for social-share previews (e.g. LinkedIn), fetching credential data from `CERTO_API_URL`.

There are no Kubernetes manifests, Helm charts, or Terraform yet (all listed as
future work in [ROADMAP.md](../ROADMAP.md) Phase 1/4). The backend Dockerfile
currently starts Strapi in **dev mode** even for the "production" image — see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md).

## CI/CD

There is exactly one GitHub Actions workflow:
`.github/workflows/frontend/autofix.yml`, which runs `eslint --fix` on the
frontend and auto-commits the result. Nothing builds, type-checks, tests, or
produces a Docker image in CI today.

## Testing

- **Frontend**: Vitest + `@vue/test-utils` + `@nuxt/test-utils` for component/unit specs (`src/frontend/components/__tests__/`, plus specs for the API clients and middleware), and Playwright E2E specs (`src/frontend/e2e/`).
- **Backend**: no automated test suite at all — no test runner configured, no spec files. The only verification tooling is `scripts/test-fresh-install.js`, a manual script that checks the seed data was created correctly.
