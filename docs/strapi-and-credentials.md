# How Strapi Sends Out Credentials

This walks through the actual code path that runs when a credential is issued —
i.e. how "Strapi is working to send out credentials," concretely, file by file.

## Entry point

Frontend calls `POST /api/credentials/issue` (via the Nuxt Nitro proxy route,
see [frontend.md](./frontend.md)) → Strapi's `credential` controller → the
`issue()` method in
`src/backend/src/api/credential/services/credential.ts`.

## Step by step (`credential.ts` service, `issue()`)

1. **Resolve the recipient.** If `recipient.id` is given, look up that
   `profile`. Otherwise find-or-create a `profile` by `recipient.email`
   (`profileType: 'Recipient'`).
2. **Find-or-create a login user for the recipient**
   (`findOrCreateUser(profile)`): checks Strapi's `users-permissions` user table
   by email; if none exists, creates one with a **randomly generated 12-char
   password**, role `authenticated`, `confirmed: true`. This is how a recipient
   who's never signed up ends up able to log into the frontend later — they'd
   need to use "forgot password" since they never see the generated password.
3. **Generate a credential ID**: `urn:uuid:${generateUUID()}` — note this is a
   hand-rolled UUID v4 generator (`Math.random()`-based), not Node's built-in
   `crypto.randomUUID()`.
4. **Sign the payload** (`generateProof(issuerId, credentialPayload)`):
   - Loads `ED25519_PRIVATE_KEY_PKCS8` from env (base64-encoded PKCS8).
   - Signs the credential payload (minus `proof`) as a JWS using `jose`'s
     `SignJWT` with `alg: 'EdDSA'`.
   - Returns a `proof` object: `{ type: 'Ed25519Signature2020', created, verificationMethod: '<baseUrl>/api/profiles/<issuerId>/keys', proofPurpose: 'assertionMethod', jws }`.
   - **If the env var is missing, this silently falls back** to a fake proof —
     `proofValue: "z" + <uuid without dashes>` — rather than failing the
     issuance. A credential issued this way looks structurally valid but carries
     no real signature at all.
5. **Persist** the `credential` row (with `proof: [proof]` attached) via
   `strapi.entityService.create`.
6. **Link back to the recipient's profile** (`receivedCredentials.connect`) and
   **attach any evidence** rows passed in.
7. **Serialize to OBv3 JSON** via
   `strapi.service('api::credential.open-badge').serializeCredential(...)` — see
   [open-badges.md](./open-badges.md) for what that object looks like.
8. **Send the email.** Looks up the `users-permissions` user for
   `recipientEntity.email`, builds a template via
   `generateCredentialIssuanceEmail()` (from
   `src/backend/src/api/credential/templates/credential-issuance.ts`), then
   calls `strapi.plugins['email'].services.email.send({ to, subject, text, html })`
   — i.e. **Strapi's built-in email plugin is the actual delivery mechanism**,
   configured with the `nodemailer` provider.
9. Returns `{ credential, openBadge, notification: { sent, error } }` to the
   caller — email failures are caught and reported back as `notification.error`
   rather than failing the whole request.

## The email provider now reads from env

`config/plugins.ts`'s `email` config used to hardcode Ethereal (a disposable
test SMTP sink) directly in source, ignoring `env('SMTP_HOST')` etc. — meaning
`docker-compose.yml`'s `SMTP_HOST=mailhog`/`SMTP_PORT=1025` (intended to route
dev email through the Mailhog container) silently had no effect. This is now
fixed: `host`/`port`/`auth.user`/`auth.pass`/`secure`/`requireTLS` and the
`defaultFrom`/`defaultReplyTo` settings all read from
`SMTP_HOST`/`SMTP_PORT`/`SMTP_USERNAME`/`SMTP_PASSWORD`/`SMTP_SECURE`/
`SMTP_REQUIRE_TLS`/`SMTP_FROM`/`SMTP_REPLY_TO` (matching `.env.example`'s
existing names), falling back to the old hardcoded Ethereal values as defaults
if unset. `requireTLS` now defaults to `false` instead of `true`, since
Mailhog doesn't support STARTTLS. See
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 7.

## The second, unused email code path was removed

`src/backend/src/api/credential/services/notification.ts` used to define
`sendBadgeIssuedEmail(credential, recipient, achievement)`, a richer email
that embedded the rendered certificate as an inline base64 image. It was
never called anywhere in the codebase (confirmed by search), so the file was
deleted as dead code rather than being wired in — reviving that richer
template is a deliberate design decision better made as part of a future
notification-provider effort, not this cleanup pass.
The real issuance flow continues to use `credential.ts`'s plainer
`templates/credential-issuance.ts` template.

## Certificates

`services/certificate.ts` renders each credential as a **certificate**: an SVG
built from `utils/certificate-template.ts`, exposed at:

- `GET /api/credentials/:id/certificate`
- `GET /verify/:id` (a direct, unauthenticated route — see
  `api/credential/routes/credential-custom.ts`)

This is a rendered visual, **not** Open Badges "baking"
(embedding assertion metadata into image bytes, an OBv2-era technique) — the
verifiable JSON lives separately and is reached via `/verify?id=...` on the
frontend.

## Revocation

`credential.revoke` (controller) simply flips `revoked: true` +
`revocationReason` on the `credential` row. The `revocation-list` content type
models a StatusList2021-style bitstring registry, but
`checkStatusInList` is a simplified comma-separated-indices implementation, and
**it isn't wired into the main verify flow** — `verifyCredential` only ever
checks the credential's own `revoked` boolean, never consults a
`revocation-list`. If you build the "real" revocation registry

## Bootstrap-time permissions

Every server start, `src/index.ts`'s `bootstrap` hook calls
`bootstrap/permissions-setup.ts`'s `setupPermissions()`, which enables broad
public/authenticated (and issuer) Strapi permissions on
`achievement`, `profile`, `credential`, `evidence`, etc. (see
[backend.md](./backend.md#permission-bootstrapping)) — this is why a fresh
Docker Compose install "just works" without manually configuring Strapi's admin
permissions UI, but it also means permission changes made by hand in the admin
panel get partially re-asserted on every restart.
