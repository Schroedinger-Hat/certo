# Certo Documentation

This folder contains developer-facing documentation for Certo, generated to give
contributors a shared, accurate picture of the system as it exists today.

| Doc | Contents |
|---|---|
| [overview.md](./overview.md) | What Certo is, who it's for, high-level feature set |
| [architecture.md](./architecture.md) | Repo layout, deployment topology, request flow, data flow |
| [frontend.md](./frontend.md) | Nuxt 3 app: pages, state, API client, auth |
| [backend.md](./backend.md) | Strapi 5 app: content types, services, config, auth |
| [strapi-and-credentials.md](./strapi-and-credentials.md) | How Strapi is used specifically to issue and send out credentials (email, signing, certificates) |
| [open-badges.md](./open-badges.md) | Open Badges 3.0 / Verifiable Credentials implementation: serialization, signing, verification, import |
| [tool-agnostic.md](./tool-agnostic.md) | Current Strapi coupling and what a real "swap the backend" abstraction would require |
| [known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) | Bugs, inconsistencies, stubs and security gaps found while documenting the system — read this before making security- or production-readiness claims |
| [security.md](./security.md) | Actual current security posture: auth, authorization caveats, key management, secrets inventory, and explicit non-implementation of HTTPS/GDPR/backups/audit logs |
| [oauth-setup.md](./oauth-setup.md) | How to enable OAuth2/OIDC login (Google/GitHub/etc.) via Strapi's admin panel — documentation-only, not end-to-end tested |
| [self-hosting.md](./self-hosting.md) | Deploying on your own domain: CORS allow-list env var, changing default admin credentials |
| [fresh-install-implementation.md](./fresh-install-implementation.md) | Pre-existing doc: how the fresh-install seed script works |

## How to use these docs

- Start with `overview.md` and `architecture.md` for orientation.
- `strapi-and-credentials.md` and `open-badges.md` are the two most detailed/technical docs — read them together, since credential issuance and Open Badges serialization are implemented in the same service files.
- `known-issues-and-dev-notes.md` intentionally documents things that are broken, stubbed, or inconsistent. It exists so future work (including a roadmap) is scoped against reality, not against what the code *looks* like it does at a glance.

These docs reflect the codebase as of 2026-07-30. Strapi, Nuxt, and the credential
services change quickly early in the project's life — if something here disagrees
with the code, trust the code and update the doc.
