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

## The email provider is effectively hardcoded

`config/plugins.ts`'s `email` config hardcodes Ethereal (a disposable test SMTP
sink) directly in source:

```ts
email: {
  config: {
    provider: 'nodemailer',
    providerOptions: {
      host: 'smtp.ethereal.email',
      auth: { user: 'gw7t4cqccle4qv53@ethereal.email', pass: 'VxnCkssx2Yw2kTfQfz' },
      ...
    },
  },
},
```

This does **not** read `env('SMTP_HOST')` etc. — meaning the `SMTP_*` variables
in `.env.example`, and `docker-compose.yml`'s `SMTP_HOST=mailhog` /
`SMTP_PORT=1025` (intended to route dev email through the Mailhog container),
currently have **no effect**. Whichever of Ethereal/Mailhog actually receives
mail depends on this mismatch, not on the env vars a developer would reasonably
expect to control it. If you're debugging "why isn't email showing up in
Mailhog," this is why. See
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md).

## A second, unused email code path exists

`src/backend/src/api/credential/services/notification.ts` defines
`sendBadgeIssuedEmail(credential, recipient, achievement)`, which builds a
richer email that embeds the rendered certificate as an inline base64 image
(via `certificate.ts`'s `generateCertificateDataUri`). **It is never called
anywhere else in the codebase** (confirmed by search) — the real issuance flow
only uses `credential.ts`'s plain-text/HTML template. Treat `notification.ts` as
dead/legacy code, not as a currently-active second notification path, unless
you're the one wiring it in.

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
`revocation-list`. If you build the "real" revocation registry described in
ROADMAP.md Phase 3/Future Features, this is the seam to close.

## Bootstrap-time permissions

Every server start, `bootstrap.ts` force-enables broad public/authenticated
Strapi permissions on `achievement`, `profile`, `credential`, `evidence`, etc.
(see [backend.md](./backend.md#permission-bootstrapping)) — this is why a fresh
Docker Compose install "just works" without manually configuring Strapi's admin
permissions UI, but it also means permission changes made by hand in the admin
panel get partially re-asserted on every restart.
