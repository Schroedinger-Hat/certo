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
   - Gets (or generates, on first use) the issuer's own Ed25519 keypair via
     `api::profile.issuer-keys`' `getOrCreateKeyPair(issuerId)` — see
     [open-badges.md](./open-badges.md#signing).
   - Signs the credential payload (minus `proof`) as a JWS using `jose`'s
     `SignJWT` with `alg: 'EdDSA'`.
   - Returns a `proof` object: `{ type: 'Ed25519Signature2020', created, verificationMethod: '<baseUrl>/api/profiles/<issuerId>/keys', proofPurpose: 'assertionMethod', jws }`.
   - **This now throws rather than falling back to a fake proof** if key
     generation/signing fails — an unsigned "signed" credential defeats the
     point of signing at all, so issuance fails loudly instead.
5. **Persist** the `credential` row (with `proof: [proof]` attached) via
   `strapi.entityService.create`.
6. **Link back to the recipient's profile** (`receivedCredentials.connect`) and
   **attach any evidence** rows passed in.
7. **Serialize to OBv3 JSON** via
   `strapi.service('api::credential.open-badge').serializeCredential(...)` — see
   [open-badges.md](./open-badges.md) for what that object looks like.
8. **Notify the recipient.** Looks up the `users-permissions` user for
   `recipientEntity.email`, then calls
   `getNotificationProvider(strapi).sendCredentialIssued({ to, achievement, credential, frontendUrl, user })`
   (`src/backend/src/api/credential/services/notification-providers/`) —
   this is a small provider interface, not a direct call into the email
   plugin. The only implementation today, `strapi-email-provider.ts`, does
   what the inline code used to do: builds a template via
   `generateCredentialIssuanceEmail()`
   (`src/backend/src/api/credential/templates/credential-issuance.ts`) and
   calls `strapi.plugins['email'].services.email.send({ to, subject, text, html })`
   — Strapi's built-in email plugin, configured with the `nodemailer`
   provider, is still the actual delivery mechanism; the interface just
   means a different provider (SES/Mailgun/Slack/...) could be swapped in
   later via `strapi.config.get('custom.notificationProvider', ...)`
   without touching `credential.ts`. No alternate providers are implemented
   yet.
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

`credential.revoke` (controller) flips `revoked: true` + `revocationReason`
on the `credential` row, **and** also flips the credential's
slot in its issuer's `revocation-list` via `revokeCredentialInStatusList`,
if it has one — older credentials issued before status lists existed won't,
in which case `revoked: true` alone is authoritative. `verifyCredential`
checks both. `checkStatusInList` remains a simplified comma-separated-indices
implementation rather than a real StatusList2021 GZIP+base64 bitstring — see
[open-badges.md](./open-badges.md#signing) and
[known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md) item 6.

Every new credential is assigned a slot in its issuer's revocation list at
issuance time (`credential.ts`'s `issue()`, via
`api::revocation-list.revocation-list`'s `getOrCreateActiveListForIssuer`/
`assignNextIndex`), and the serialized OBv3 credential now includes a
`credentialStatus` (StatusList2021Entry) object pointing at it.

## Webhooks

`api::webhook-subscription` (`url`, `events[]`, `secret`, `enabled`) has
**no REST routes at all** — subscriptions are managed via the admin panel's
content manager only, not a public API, for this first pass.
`api::webhook-subscription.dispatch`'s `dispatch(event, payload)` POSTs
`{ event, timestamp, data: payload }` to every enabled subscription whose
`events` list includes `event`, signing the body with
`HMAC-SHA256(subscription.secret)` in an `X-Certo-Signature` header (the
GitHub/Stripe convention) and a 5s timeout via `AbortSignal.timeout`. Uses
Node's global `fetch` — no new HTTP client dependency.

`credential.ts`'s `issue()` dispatches `credential.issued` after creating
the credential; the revoke controller dispatches `credential.revoked`. Other
events ROADMAP.md lists (`badge.created`, `issuer.created`, `user.created`,
etc.) aren't wired yet. Delivery is fire-and-forget — each subscription's
delivery is independently caught and logged
(`strapi.log.warn`) on failure, so one bad endpoint can't affect others or
fail the request that triggered it. There's no retry queue (would need a
job runner) and no delivery log/history.

## Bootstrap-time permissions

Every server start, `src/index.ts`'s `bootstrap` hook calls
`bootstrap/permissions-setup.ts`'s `setupPermissions()`, which enables broad
public/authenticated (and issuer) Strapi permissions on
`achievement`, `profile`, `credential`, `evidence`, etc. (see
[backend.md](./backend.md#permission-bootstrapping)) — this is why a fresh
Docker Compose install "just works" without manually configuring Strapi's admin
permissions UI, but it also means permission changes made by hand in the admin
panel get partially re-asserted on every restart.
