# Known Issues & Dev Notes

Things found while documenting the system that are broken, stubbed, inconsistent,
or otherwise worth knowing before making claims (production-readiness,
security, "how does X work") elsewhere. Grouped by severity/theme, not by file.

Items marked **[Fixed]** were corrected after this was first written — kept
here (rather than deleted) so the history/rationale isn't lost, since
several of them are the kind of thing that tends to silently regress.

## Security-relevant

1. **[Fixed] Credential proof verification is now cryptographic
   for locally-issued credentials.** `verification.ts`'s `verifyProof()` used
   to only check structural fields, never the actual signature. It now fetches
   the issuer's public key (`api::profile.issuer-keys`' `getPublicKey()`) and
   calls `jose.jwtVerify(proof.jws, publicKey)`, failing on any mismatch,
   missing key, or malformed JWS. See
   [open-badges.md](./open-badges.md#verification). This does **not** cover
   externally-submitted credentials — see item 4.

2. **[Fixed] Signing no longer silently degrades if the key is
   missing.** `credential.ts`'s `generateProof()` used to catch any signing
   error and fall back to a fake `proofValue` instead of failing the
   issuance. Now that keys are generated automatically per issuer
   (`api::profile.issuer-keys`), the original failure mode (a missing global
   env var) can't happen, and any other signing error now propagates and
   fails the issuance instead of silently producing an unsigned "signed"
   credential.

3. **[Partially superseded] The old global Ed25519 dev keypair
   committed to the repo** (`ed25519-private.pem` / `ed25519-public.pem` at
   the repo root) and `docker-compose.yml`'s hardcoded default for
   `ED25519_PRIVATE_KEY_PKCS8` are now **unused** — signing uses per-issuer
   keys generated automatically (see item 1/2 and
   [open-badges.md](./open-badges.md#signing)) and encrypted at rest via a
   new `ENCRYPTION_KEY`-derived AES-256-GCM key (`utils/key-encryption.ts`).
   The `.pem` files and the `ED25519_PRIVATE_KEY_PKCS8` var were left in
   place (not deleted) to keep this change's diff scoped to signing/
   verification — cleaning up the now-dead files is a good small follow-up.
   `ENCRYPTION_KEY` itself has the same "make sure production generates its
   own, don't reuse the dev default" caveat the old key had.

4. **External-credential proof verification is still a stub.**
   `open-badge.ts`'s `validateExternalCredential()` sets
   `const proofVerified = true` unconditionally — importing/validating a
   third-party OBv3 credential doesn't check its signature. Deliberately not
   addressed here: that work covers *our own* issuers' keys; verifying
   an arbitrary external issuer needs DID resolution or fetching a remote
   key, a separate, larger interoperability feature.

5. **Several controller actions bypass Strapi's permission system in code**
   rather than through the role/permission model — e.g. `credential.issue` sets
   `ctx.state.auth = { strategy: { name: 'public' } }` to disable the auth
   check, and `achievement.create` calls `entityService` directly to bypass
   permission checks. Don't assume permissions shown in the Strapi admin UI
   fully describe what's actually enforced.

6. **[Fixed] Revocation lists are now wired into issuance,
   revocation, serialization, and verification.** Previously the entire
   `revocation-list` subsystem was dead code — `checkCredentialStatus`,
   `checkStatusInList`, `createStatusListCredential`, and
   `revokeCredentialInStatusList` had zero callers, and there was no field
   linking a credential to a slot in any list at all. Now: `credential.ts`'s
   `issue()` assigns a slot in the issuer's list (creating one on first
   use), the revoke controller flips that slot too, `open-badge.ts` emits a
   `credentialStatus` (StatusList2021Entry) object in the serialized OBv3
   JSON, and `verification.ts` also checks the list alongside the `revoked`
   boolean. `checkStatusInList` remains a simplified comma-separated-indices
   implementation, not a real GZIP+base64 bitstring — documented as a known
   simplification rather than fixed, since publishing a standards-compliant
   external status list credential is a separate, larger task. See
   [open-badges.md](./open-badges.md) and
   [strapi-and-credentials.md](./strapi-and-credentials.md).

## Correctness / config bugs

7. **[Fixed] `SMTP_*` env vars had no effect.**
   `src/backend/config/plugins.ts` hardcoded Ethereal SMTP credentials
   directly in source instead of reading from env, so
   `docker-compose.yml`'s `SMTP_HOST=mailhog`/`SMTP_PORT=1025` silently did
   nothing. Fixed by reading `SMTP_HOST`/`SMTP_PORT`/`SMTP_USERNAME`/
   `SMTP_PASSWORD`/`SMTP_FROM`/`SMTP_REPLY_TO`/`SMTP_SECURE`/`SMTP_REQUIRE_TLS`
   from env (matching the names already used in `.env.example`), with the
   previous hardcoded Ethereal values kept as defaults for anyone who hasn't
   set the vars. `requireTLS` now defaults to `false` rather than `true`,
   since Mailhog (the Docker Compose dev SMTP target) doesn't support
   STARTTLS — Ethereal still works fine with it unset since nodemailer
   upgrades to STARTTLS opportunistically when the server offers it. The
   pre-existing (separately hardcoded) `SMTP_FROM_EMAIL` env var name used by
   `users-permissions.advanced.email_reset_password` was also corrected to
   `SMTP_FROM`, matching `.env.example`.

8. **[Fixed] Backend Dockerfile booted in dev mode.**
   `src/backend/Dockerfile` built with `npm run build` but started the
   container with `CMD ["npm", "run", "develop"]` (Strapi dev mode), and
   overwrote `config/middlewares.js` with a minimal placeholder during the
   build step, discarding the real CORS/CSP config from
   `config/middlewares.ts`. Fixed: the middlewares-overwrite step was removed
   and `CMD` now runs `npm run start`.

9. **[Fixed] `src/bootstrap.ts` was entirely dead code, not a
   second active implementation.** The original note here described this as
   "two parallel permission-bootstrap implementations." On closer inspection,
   Strapi 5 only auto-loads `src/index.ts` as the app's `register`/`bootstrap`
   lifecycle hooks — and `index.ts` only imports from
   `./bootstrap/seed-data` and `./bootstrap/permissions-setup`. The
   standalone `src/bootstrap.ts` (with `setupPublicPermissions`,
   `setupAuthenticatedPermissions`, `forceEnableEndpoints`,
   `enableAllAuthenticatedPermissions`, `setupIssuerPermissions`) was never
   imported by anything and never ran. Its one piece of functionality nothing
   else covered — issuer-role permissions — was ported into
   `bootstrap/permissions-setup.ts` as a new `ISSUER_PERMISSIONS` list, wired
   through the existing `setupRolePermissions(strapi, 'issuer', ...)` call.
   `src/bootstrap.ts` was then deleted. Also deleted:
   `src/backend/src/bootstrap/permissions-setup.js`, a stale, incomplete
   (public-permissions-only) JS duplicate of `permissions-setup.ts` that
   wasn't the file `index.ts` actually imports — `permissions-setup.ts` is now
   the single source of truth for permission bootstrapping.

10. **[Fixed] `notification.ts`'s `sendBadgeIssuedEmail` was dead
    code.** It built a richer email (with an inline certificate image) but
    was never called anywhere in the codebase — confirmed by search. The real
    issuance flow (`credential.ts`) uses a plainer template
    (`templates/credential-issuance.ts`). The file was deleted rather than
    wired in, since reviving it is a design decision (which template should
    "win," and whether embedding a base64 certificate image in every
    issuance email is desirable) better made deliberately later, not as
    part of this cleanup.

11. **Routing overlap in the credential API.** `credential-public.ts` defines
    `GET /api/credentials/:id`, which Strapi's core router would already
    generate from the content-type schema; `credential-fallback.ts` exists
    explicitly "as a last resort" for public listing. Signs of prior
    permission/routing struggles rather than a single clean source of truth per
    route — check both files before assuming which one actually serves a given
    request. Not addressed yet.

## Doc / metadata inconsistencies

12. **[Fixed] License conflict.** Root `LICENSE` is AGPL-3.0 (and
    the README agrees) — confirmed as the correct license going forward.
    `docs/fresh-install-implementation.md`, `scripts/fresh-install.sh`,
    `src/backend/scripts/fresh-install.js`, and
    `src/backend/scripts/README.md` all previously claimed MIT (including two
    places where the *running script itself* printed "This project is
    licensed under the MIT License" to the console) — all four were corrected
    to reference AGPL-3.0.

13. **Not actually a conflict: two different scripts create two different
    sets of seed credentials, on purpose.** The original note here treated
    README's `admin@certo.com`/`certo` and
    `docs/fresh-install-implementation.md`'s `admin@certo.com`/`Admin123!` +
    `issuer@certo.com`/`Issuer123!` as inconsistent docs. They're not — they
    describe two separate, independent seeding mechanisms:
    - `src/backend/src/bootstrap/seed-data.ts`'s `seedDevelopmentData()` runs
      automatically on every `docker-compose up` (via `src/index.ts`'s
      `bootstrap` hook, skipped in production, no-ops if the admin already
      exists) and creates `admin@certo.com`/`certo` — this is what the README
      describes.
    - `scripts/fresh-install.sh` → `src/backend/scripts/fresh-install.js` is a
      separate, manually-invoked script (written for
      [issue #57](https://github.com/Schroedinger-Hat/certo/issues/57)) that
      creates a *different* admin (`admin@certo.com`/`Admin123!`) plus a
      distinct issuer user (`issuer@certo.com`/`Issuer123!`) and a richer set
      of sample data. This is what `docs/fresh-install-implementation.md`
      describes.

    Worth flagging to the team as a UX footgun even though it's not a doc
    bug: running both against the same database means `admin@certo.com`
    ends up governed by whichever script ran first (the automatic
    `seedDevelopmentData` no-ops if that email already exists), so the
    "current" admin password depends on order of operations. Not fixed here
    since resolving it means a product decision (should there be one seeding
    mechanism, not two?) rather than a docs/config bug.

14. **[Fixed] `CONTRIBUTING.md` referenced a `frontend/` directory**
    that doesn't exist (it's `src/frontend/`) and a backend `npm test` script
    that doesn't exist either (the backend has no test script — see #19).
    Both corrected.

15. **`.cursorrules` (repo root) describes an unrelated Next.js 15/React 19/
    Vercel AI SDK stack** — it's an unedited generic template, not real
    architecture guidance for this project. `.cursor/rules/vue.mdc` is the
    relevant one (Nuxt3/Vue3/UnoCSS/UnaUI/Strapi5), though it also ends
    mid-sentence, suggesting it too was assembled from a template and never
    finished. Not addressed here (low priority, no functional impact).

## Minor / cleanup

16. Two empty, unreferenced scaffold directories exist at
    `src/frontend/src/frontend/` and `src/frontend/src/frontend-una/` — not used
    by `nuxt.config.ts`. Safe to delete.

17. `netlify/functions/og-credential/` ships its own `package.json`/lockfile and
    (per the exploration pass) a large vendored `node_modules` — worth checking
    it's actually gitignored.

18. `nuxt-gtag` ships with a hardcoded GA4 measurement ID and a `TODO` comment
    to replace it — flag before treating analytics as configured per-deployment.

19. **[Fixed] Backend now has a Jest suite and both apps run in
    CI.** Coverage is intentionally narrow (unit tests for the new/changed
    crypto logic — `key-encryption.ts`, `issuer-keys.ts`,
    `verification.ts`'s `verifyProof()` — not a full Strapi-integration test
    suite; see [architecture.md](./architecture.md#testing)).
    `.github/workflows/ci.yml` runs backend type-check/test/build and
    frontend test/build on push/PR to `main`, alongside the pre-existing
    `frontend/autofix.yml`. Playwright E2E still isn't run in CI. Broader
    backend test coverage (controllers, other services) remains a good
    follow-up.
