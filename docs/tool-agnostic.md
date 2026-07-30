# Becoming Tool-Agnostic

This doc is an honest assessment of the gap between
vision and the current code, so future work can be scoped realistically.

## Bottom line

**There is currently no abstraction layer anywhere in the codebase.** Certo
today is tightly coupled to Strapi specifically — not just "a CMS" — and to a
lesser extent to Nuxt/Vue on the frontend. A repo-wide search for
`adapter`/`provider pattern`/`pluggable`/`abstraction` finds nothing at the
application level (Strapi's own provider config keys for email/upload are the
only "provider" concept in the codebase).

## Where the coupling lives, concretely

1. **The domain model *is* the Strapi schema.** Achievement/credential/profile/
   evidence/endorsement/revocation-list are defined as Strapi `schema.json`
   files (`content-types/*/schema.json`) using Strapi-specific constructs
   (`collectionType`, `pluginOptions`, `component` references like
   `"component": "badge.proof"`). There's no backend-agnostic domain
   model/DTO layer above this that a different system could implement against
   — the schema *is* the contract.

2. **Business logic lives inside Strapi's service/controller framework.**
   Every service function takes `({ strapi })` and calls
   `strapi.entityService.*`, `strapi.db.query(...)`, `strapi.query(...)`,
   `strapi.plugins.email.services.email.send(...)`,
   `strapi.service('api::credential.open-badge')`, etc. Issuance, signing,
   verification, and notification (see [strapi-and-credentials.md](./strapi-and-credentials.md)
   and [open-badges.md](./open-badges.md)) are written *as* Strapi code, not as
   a separable domain layer that happens to be wired into Strapi at the edges.

3. **The frontend is Strapi-response-shape-aware.** `ApiClient.formatCredential()`
   in `src/frontend/api/api-client.ts` explicitly branches on Strapi v4
   (`{ attributes: {...} }`) vs Strapi v5 (flat) response shapes, and other
   methods build Strapi-specific query strings (`populate=*`,
   `filters[profileType][$eq]=...`). Swapping the backend would mean rewriting
   this client, not just repointing a base URL.

4. **Auth is Strapi's `users-permissions` plugin**, its specific endpoints
   (`/api/auth/local`, `/api/auth/local/register`, `/api/users/me`), and its
   role model (`public`/`authenticated`/custom `issuer`). No OAuth2/OIDC
   abstraction exists.

5. **Email is Strapi's plugin system**
   (`strapi.plugins.email.services.email.send`), configured with a single
   hardcoded nodemailer/Ethereal provider (see
   [strapi-and-credentials.md](./strapi-and-credentials.md)) — no
   notification-provider abstraction. Slack/Teams/multi-provider email are
   aspirations only.

6. **Signing uses one global env-var key**, not a pluggable KMS/HSM/DID-resolver
   abstraction — despite `profile.publicKey`/`did` schema fields hinting at a
   future multi-issuer-key design (see [open-badges.md](./open-badges.md#signing)).

## What a real abstraction layer would need

If/when this becomes an active goal (rather than aspirational text), the
natural seams to insert interfaces at are:

- **Domain/port layer for credentials**: a backend-agnostic
  `Achievement`/`Credential`/`Profile`/`Evidence` model plus a
  `CredentialRepository`/`CredentialStore` interface, with a Strapi
  implementation as the first (and for now, only) adapter. This is the biggest
  piece of work — it means extracting the domain model *out of* the Strapi
  schema files into something Strapi's schema then maps onto, rather than
  being the source of truth itself.
- **Signing/verification port**: an interface like
  `sign(payload, issuerId): Proof` / `verify(credential): boolean` that the
  current `jose`/Ed25519 implementation satisfies, so a KMS-backed or
  per-issuer-key implementation can be swapped in later without touching
  callers.
- **Notification port**: an interface like `sendCredentialIssued(recipient, credential)`
  with the current Strapi-email implementation as one provider, matching
  "Notification Providers" (Slack/Teams/Email) and "Email
  Providers" (SMTP/SES/Mailgun/SendGrid) sections.
- **API client contract on the frontend**: a stable, backend-agnostic response
  shape that `ApiClient` normalizes *to*, decoupling `formatCredential()`'s
  Strapi-v4/v5-aware logic from the rest of the frontend.
- **Auth provider abstraction**: matching OAuth2/OIDC/LDAP/SCIM
  goals — today this would require introducing an auth-provider interface
  Strapi's `users-permissions` satisfies as the default.

None of this exists yet. Treat "tool agnostic" as a multi-phase architectural
project, not a small refactor —
the coupling isn't superficial (e.g. just import paths), it's baked into the
data model, the service layer, and the frontend client all at once.
