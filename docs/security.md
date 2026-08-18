# Security

This describes Certo's *actual current* security posture — what's
implemented today. Gaps are called
out explicitly rather than glossed over; see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) for the
full, itemized list this doc draws from.

## Authentication

Strapi's bundled `users-permissions` plugin: local email/password only, JWT
tokens (`JWT_SECRET`, 7-day expiry — `src/backend/config/plugins.ts`). The
Strapi admin panel (`/admin`) has its own, separate JWT
(`ADMIN_JWT_SECRET`).

**Not implemented**: OAuth2/OIDC, LDAP, SCIM — all. No 2FA.

## Authorization

Five role permission-sets are seeded on every server start by
`bootstrap/permissions-setup.ts`'s `setupPermissions()` (see
[backend.md](./backend.md#permission-bootstrapping)), though only three
roles actually exist out of the box:

| Role | Can | Exists by default? |
|---|---|---|
| `public` | Read achievements/profiles/credentials, verify/validate a credential | Yes |
| `authenticated` | Full CRUD on credentials/achievements/profiles, custom endpoints (`me`, `myIssuedCredentials`, etc.) | Yes |
| `issuer` | Issue/revoke/import/export credentials, manage achievements | No — an admin must create it in the admin panel |
| `reviewer` | Read/verify everything, no create/update/delete | No — same as issuer |
| `viewer` | Read-only (narrower than reviewer — no evidence) | No — same as issuer |

`setupRolePermissions()` looks up each role by `type` and no-ops (with a log
message) if it doesn't exist yet — the `reviewer`/`viewer` permission lists
are inert until someone actually creates those roles via
**Settings → Users & Permissions → Roles** in the admin panel, exactly like
`issuer` already was before this doc was written.

## Authorization

Five role permission-sets are seeded on every server start by
`bootstrap/permissions-setup.ts`'s `setupPermissions()` (see
[backend.md](./backend.md#permission-bootstrapping)), though only three
roles actually exist out of the box:

| Role | Can | Exists by default? |
|---|---|---|
| `public` | Read achievements/profiles/credentials, verify/validate a credential | Yes |
| `authenticated` | Full CRUD on credentials/achievements/profiles, custom endpoints (`me`, `myIssuedCredentials`, etc.) | Yes |
| `issuer` | Issue/revoke/import/export credentials, manage achievements | No — an admin must create it in the admin panel |
| `reviewer` | Read/verify everything, no create/update/delete | No — same as issuer |
| `viewer` | Read-only (narrower than reviewer — no evidence) | No — same as issuer |

`setupRolePermissions()` looks up each role by `type` and no-ops (with a log
message) if it doesn't exist yet — the `reviewer`/`viewer` permission lists
are inert until someone actually creates those roles via
**Settings → Users & Permissions → Roles** in the admin panel, exactly like
`issuer` already was before this doc was written.

**Known caveat, don't assume the above is fully enforced**: several
controller actions bypass this permission system directly in code rather
than going through role/permission checks (e.g. `credential.issue`
disables the auth check explicitly; `achievement.create` bypasses
permission checks by calling `entityService` directly) — see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 5.
These three actions (`credential.issue`, `credential.revoke`,
`achievement.create`) now write an `audit-log-entry` row (action, entity,
real caller's user ID, metadata) — viewable via the admin panel's content
manager, no REST endpoint — so at least *who* did them is recoverable after
the fact, even though the permission bypass itself isn't fixed. Audit
logging doesn't yet cover every mutating action, only these three.
Multi-tenancy and richer RBAC roles beyond Reviewer/Viewer remain
future work.

## Credential signing & verification

Each issuer profile has its own Ed25519 keypair, generated automatically on
first use (`api::profile.issuer-keys`). The private key is encrypted at
rest (AES-256-GCM, keyed by `SHA-256(ENCRYPTION_KEY)` —
`src/backend/src/utils/key-encryption.ts`) in a content type
(`issuer-key`) that has **no REST routes at all**, so it's unreachable
except from server-side code. Verifying a credential issued by this
instance checks the real Ed25519/JWS signature
(`jose.jwtVerify`) against that key — see
[open-badges.md](./open-badges.md#signing) and
[open-badges.md](./open-badges.md#verification) for the full detail.

Externally-submitted (third-party-issued) OBv3 credentials using Ed25519
compact JWS proofs are also checked cryptographically. HTTPS verification
methods and `did:web` issuer documents are supported, with the proof bound to
its declared verification method. Other proof suites and external status-list
resolution remain unsupported.

## Secrets inventory

All of these live in `src/backend/.env` (see `.env.example` for the full
list) and **must be regenerated for any real deployment** — the repo's
`.env.example`/`.env`/`docker-compose.yml` values are committed dev
defaults, not secrets:

| Var | Protects |
|---|---|
| `JWT_SECRET` | Frontend/API user session tokens (`users-permissions`) |
| `ADMIN_JWT_SECRET` | Strapi admin panel sessions |
| `APP_KEYS` | Strapi session/cookie signing |
| `API_TOKEN_SALT` | Strapi API token hashing |
| `TRANSFER_TOKEN_SALT` | Strapi data-transfer token hashing |
| `ENCRYPTION_KEY` | Per-issuer private signing keys at rest (see above) |

The old single shared `ED25519_PRIVATE_KEY_PKCS8` var (and the committed
`ed25519-private.pem`/`ed25519-public.pem` files at the repo root) are
leftover from before per-issuer keys existed and are no longer read by any
code path — see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 3.

## Transport security (HTTPS)

Not configured by the application itself — Certo expects to run behind a
reverse proxy or PaaS that terminates TLS. The actual deployed topology
today (Netlify + Strapi Cloud, per
[architecture.md](./architecture.md#deployment-topology)) handles this at
the platform level. Self-hosting via the repo's Docker Compose setup does
**not** set up HTTPS — that's left to whatever's put in front of it

## GDPR, backups, audit logs

**Backups and a basic audit log now exist; GDPR-specific tooling still
doesn't.**

- **Audit log**: `api::audit-log-entry.audit-log`'s `record()` is called at
  credential issuance/revocation and achievement creation - see
  [known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 5.
  It's not comprehensive (not every mutating action is recorded) and there's
  no admin-panel UI beyond the raw content-manager view of the entries.
- **Backup/restore**: `npm run backup`/`npm run restore` (DB-native -
  `pg_dump`/`pg_restore` for Postgres, file copy for sqlite - plus
  `public/uploads`) - see [self-hosting.md](./self-hosting.md#backup--restore).
  No automated/scheduled backups; this is a manual operator tool, not a
  managed backup service.
- **Data export/deletion (GDPR)**: still no purpose-built deletion tooling.
  There is now a self-service *export* path
  (`GET /api/profiles/me/export`, see
  [self-hosting.md](./self-hosting.md#take-your-own-data-with-you)) that
  covers data portability, but nothing analogous for right-to-erasure -
  deleting a profile/account still means manual DB access.

## Reporting a vulnerability

There is currently no `SECURITY.md` or disclosed process for reporting
vulnerabilities privately. Until one exists, open an issue on the
[GitHub repo](https://github.com/Schroedinger-Hat/certo) — being mindful
that issues are public, so avoid posting exploit details for unfixed
issues there.
