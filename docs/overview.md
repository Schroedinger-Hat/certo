# Overview

Certo is a digital credentialing platform: it lets an organization define
**achievements** (badge classes), **issue** them as verifiable **credentials** to
recipients, and lets anyone **verify** a credential later. It implements the
[Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/) specification, which is
itself built on the [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/).

Maintained by [Schrödinger Hat](https://www.schrodinger-hat.it/), an Italian tech
community. Repo: `Schroedinger-Hat/certo`. License: AGPL-3.0 — confirmed as
correct; a stray MIT mention in a few scripts/docs was fixed, see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 12.

## What it does today

- Define **achievements** (name, description, criteria, skill/alignment tags, image) — the "badge class".
- **Issue** an achievement to a recipient by email, producing a signed **credential** (OBv3 VerifiableCredential/OpenBadgeCredential), and email the recipient a link to it.
- **Batch issue** an achievement to many recipients at once.
- Render each credential as a **certificate** (SVG image) for display/download/social sharing.
- **Verify** a credential by ID — checks revocation, expiration, and the Ed25519 JWS proof.
- **Verify external** Ed25519 credentials using HTTPS verification methods or `did:web` issuer documents.
- **Import** an external OBv3 credential JSON, creating local `profile`/`achievement`/`credential` rows for it.
- **Revoke** a credential.
- Basic **auth** (register/login) with three roles: `public`, `authenticated`, `issuer`.
- Generate an Open Graph preview image for a credential (via a separate Netlify Function) for LinkedIn/social sharing.

## What it explicitly does *not* do yet

These are current gaps, not just "future features" — see
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) for the
stubs/placeholders in the code and for the long term plan:

- Other proof suites and external revocation status-list resolution are not implemented yet — see [open-badges.md](./open-badges.md#verification).
- Outbound webhooks are supported for configured credential and lifecycle events;
	an internal event bus and pluggable notification providers are not implemented.
- No multi-tenancy; fixed-role authorization and audit logging are implemented.
- No OAuth2/OIDC; local auth only (Strapi's `users-permissions`).
- Backend test coverage is narrow (unit tests for the signing/verification code only, no full integration suite) and Playwright E2E isn't run in CI yet.
- No abstraction that would let a different CMS/backend replace Strapi (see [tool-agnostic.md](./tool-agnostic.md)).

## Two ways to run it

1. **Docker Compose** (`docker compose up -d` from repo root) — Postgres + Mailhog (fake SMTP inbox) + backend + frontend. This is the dev/self-host path.
2. **Locally without Docker** — `cd src/backend && npm run develop` (Strapi, SQLite by default) and `cd src/frontend && npm run dev` (Nuxt), in separate terminals.

Production today is actually neither of these — see [architecture.md](./architecture.md#deployment-topology)
for the real hosted topology (Netlify + Strapi Cloud), which is separate from the
Docker Compose setup in this repo.
