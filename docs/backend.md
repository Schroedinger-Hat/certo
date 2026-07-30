# Backend

`src/backend/` — [Strapi 5.15.0](https://strapi.io/) (TypeScript), Node 18–22.
Uses `better-sqlite3` (dev default DB), `jose` for JWT/JWS crypto, the
`@strapi/plugin-cloud` and `@strapi/plugin-users-permissions` plugins, and both
`@strapi/provider-email-nodemailer` and `@strapi/provider-email-sendmail` as
available (unused) email providers.

Strapi here is used as more than a content-modeling CMS — the credential
issuance, signing, verification, and email logic is all written as custom
Strapi controllers/services layered on top of the generated content-type CRUD.
See [strapi-and-credentials.md](./strapi-and-credentials.md) for that part in
detail; this doc covers the surrounding structure.

## Folder structure

```
src/backend/src/
├── api/                     # one folder per Strapi content-type API
│   ├── achievement/         # badge class
│   ├── credential/          # badge award / OBv3 VerifiableCredential
│   ├── endorsement/         # OBv3 Endorsement
│   ├── evidence/
│   ├── profile/             # issuer and/or recipient identity
│   ├── revocation-list/     # StatusList2021-style revocation registry
│   └── upload/services/enhanced-upload.ts   # permission override on Strapi's upload API
├── components/badge/        # reusable sub-schemas: criteria, alignment, public-key, skill, proof
├── index.ts                 # Strapi's actual register/bootstrap lifecycle entry point
├── bootstrap/                # seed-data.ts, permissions-setup.ts (see "Permission bootstrapping" below)
├── config/                  # admin.ts, api.ts, database.ts, middlewares.ts, plugins.ts, frontend.ts, server.ts
├── extensions/users-permissions/content-types/user/schema.json   # Strapi's built-in User type, no custom fields added
├── middlewares/             # cors-header.ts, request-logger.ts, global/badges-redirect.js, global/request-logger.js
├── admin/                   # admin panel customization scaffolding — all *.example files, i.e. inactive
├── utils/certificate-template.ts   # SVG certificate renderer
└── types/strapi.d.ts
```

`src/backend/scripts/` holds `fresh-install.js` (creates seed data + configures
permissions on first run) and `generate-test-email.js`; see
[fresh-install-implementation.md](./fresh-install-implementation.md).

## Content types

| Collection | Purpose | Key relations / fields |
|---|---|---|
| `achievement` | Achievement/"badge class" definition | `creator`→profile, `credentials`←credential, components: `criteria`, `alignment[]`, `skills[]` |
| `credential` | Badge award / OBv3 VerifiableCredential | `achievement`, `issuer`→profile, `recipient`→profile, `evidence`←evidence, `proof[]` component |
| `profile` | Issuer and/or recipient identity | `profileType` enum `Issuer\|Recipient\|Both`, `did`, `publicKey[]` component, back-relations to created achievements / issued / received credentials |
| `evidence` | Evidence attached to a credential | `credential`→credential |
| `endorsement` | Third-party attestation (OBv3 Endorsement) | `endorser`→profile, `endorsedObject` (URI string), `claim` (json), `proof` component |
| `revocation-list` | StatusList2021-style revocation registry | `issuer`→profile, `encodedList` — see caveat in [known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md), it isn't actually wired into the verify flow |
| `issuer-key` | Per-issuer Ed25519 signing keypair (private key encrypted at rest) | `profile`→profile (oneToOne). **Has no routes/controllers/services — no REST endpoint exists for it at all**, so it's reachable only from server-side code (`strapi.db.query`/`entityService`), never through any role's permissions. See [open-badges.md](./open-badges.md#signing). |

Components (`src/backend/src/components/badge/*.json`): `criteria`, `alignment`,
`public-key`, `skill`, `proof` — these directly model Open Badges 3.0
sub-structures. See [open-badges.md](./open-badges.md).

## API structure

REST only, prefix `/api` (`config/api.ts`: `defaultLimit: 25`, `maxLimit: 100`),
following Strapi's usual conventions (`/api/achievements`, `/api/profiles`,
`/api/credentials`, `/api/evidences`, `/api/endorsements`,
`/api/revocation-lists`), plus a lot of hand-written custom routes layered on
top (`credential-authenticated.ts`, `credential-custom.ts`,
`credential-fallback.ts`, `credential-public.ts`, `credential.ts` inside
`api/credential/routes/`). There's real overlap here — e.g. `credential-public.ts`
defines `GET /api/credentials/:id`, which Strapi's core router would already
generate, and `credential-fallback.ts` exists explicitly "as a last resort" for
public credential listing. This is evidence of permission/routing workarounds
rather than a clean single source of truth for each route — worth being aware of
before adding new credential routes.

No GraphQL plugin. Swagger/OpenAPI is **not enabled** in `config/plugins.ts`
despite the README mentioning it ("after enabling the Swagger plugin") — OpenAPI
generation is scheduled to be supported.

## Database

Strapi's built-in Query Engine / Entity Service (Knex underneath) — no separate
ORM (no Prisma/TypeORM). Dev default is SQLite (`better-sqlite3`,
`.tmp/data.db`); `config/database.ts` also supports MySQL and Postgres via
`DATABASE_CLIENT`. Docker Compose runs Postgres 16.

## Auth

Strapi's bundled `users-permissions` plugin: JWT-based
(`JWT_SECRET`, 7-day expiry, `config/plugins.ts`), three roles — `public`,
`authenticated`, and a custom `issuer` role. Admin-panel auth is separate
(Strapi's own admin JWT, `ADMIN_JWT_SECRET`).

**Important caveat**: several controller actions bypass this permission system
directly in code rather than relying on role/permission checks — e.g.
`credential.issue` explicitly sets
`ctx.state.auth = { strategy: { name: 'public' } }` ("temporarily disable auth
check"), and `achievement.create` bypasses permission checks by calling
`entityService` directly. Don't describe the current system as enforcing a
strict RBAC model in downstream docs — see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md).

## Permission bootstrapping

`src/index.ts` is Strapi's actual `register`/`bootstrap` lifecycle entry
point. Its `bootstrap({ strapi })` runs on **every** server start and calls
`bootstrap/seed-data.ts`'s `seedDevelopmentData()` (creates sample data on
first run, no-op after — see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 13 for
how this relates to the separate `scripts/fresh-install.js`), then
`bootstrap/permissions-setup.ts`'s `setupPermissions()`, which force-enables
public/authenticated/issuer Strapi permissions across all content types.

There used to be a second, unreferenced implementation of similar logic at
`src/bootstrap.ts` (Strapi 5 only auto-loads `src/index.ts`, not a standalone
`src/bootstrap.ts`, so it never ran) plus a stale duplicate
`bootstrap/permissions-setup.js`. Both were dead code and have been removed;
the one piece of unique logic they contained (issuer-role permissions) was
ported into `bootstrap/permissions-setup.ts`'s `ISSUER_PERMISSIONS` list. See
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 9.

## Config

- `config/database.ts` — multi-client (`sqlite`/`mysql`/`postgres` via `DATABASE_CLIENT`).
- `config/middlewares.ts` — custom CORS allow-list (see [architecture.md](./architecture.md#deployment-topology) for what it reveals about the real deployment) and CSP.
- `config/plugins.ts` — `users-permissions` JWT config, `upload` = local provider, `email` = nodemailer, reading `SMTP_*` env vars (`.env.example`'s names) with the old hardcoded Ethereal test credentials kept only as fallback defaults — see [strapi-and-credentials.md](./strapi-and-credentials.md) for detail on this fix.
- `config/frontend.ts` — a custom `custom.frontendUrl` value, used by the email/notification services to build links back to the frontend.

## Deployment

`src/backend/Dockerfile`: `node:20-alpine`, `npm ci`, installs `pg` explicitly,
runs `npm run build`, then starts the container with `npm run start` (Strapi
production mode). It used to overwrite `config/middlewares.js` with a minimal
inline placeholder during the build (silently stripping the real CORS/CSP
config from `config/middlewares.ts`) and start with `npm run develop` instead
— both fixed, see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 8.
