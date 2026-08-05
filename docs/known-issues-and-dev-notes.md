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
   fully describe what's actually enforced. **[Partially mitigated]**
   these three actions (`credential.issue`, `credential.revoke`,
   `achievement.create`) now record an `audit-log-entry` with the real
   caller's user ID, so "who did this" is at least recoverable after the
   fact even though the permission bypass itself is unchanged — see
   [security.md](./security.md#authorization).

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
    that didn't exist at the time (it does now — see #19). Both corrected.

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

20. **[Fixed] `strapi.log.error()`/`.warn()` only print their first
    argument.** Unlike `console.error`, Strapi's Winston-based logger
    doesn't concatenate/print additional arguments — every
    `strapi.log.error('message:', error)` call in the codebase (seed data,
    permission setup, credential issuance error handlers, the upload
    service) was silently discarding the actual error, so a real failure
    in any of these paths would show up in logs as e.g.
    `[Seed] Error seeding development data:` with nothing useful after it.
    Fixed by interpolating error details directly into the log message.
    Confirmed by simulating a failure before/after the fix. If you add a
    new `strapi.log.*` call, pass one interpolated string, not multiple
    arguments.

## Self-hosting

Found and reported via a real self-hosted deployment attempt —
[issue #78](https://github.com/Schroedinger-Hat/certo/issues/78) is the full
deployment log; #75/#76/#77 below are the three concrete bugs split out of it.
The Dockerfile dev-mode issue also reported there was already covered by
item 8 above.

21. **[Fixed] CORS middleware crashed (`originList.split is not a
    function`) for any origin not on the hardcoded whitelist**
    ([#75](https://github.com/Schroedinger-Hat/certo/issues/75)).
    `config/middlewares.ts`'s `strapi::cors` origin function returned `false`
    for unrecognized origins, but `@strapi/core`'s cors middleware
    unconditionally calls `.split(',')` on whatever the function returns -
    `false` isn't a string or array, so every request from a non-whitelisted
    origin threw internally. Fixed by returning `''` instead (the sentinel
    `@koa/cors`/Strapi's wrapper already use internally for "no match"), and
    by making the whitelist extensible via a new `CORS_ALLOWED_ORIGINS`
    env var (comma-separated) so self-hosters don't have to edit source to
    deploy on their own domain.

22. **[Fixed] `GET /api/users/me?populate=*` returned 403, breaking
    any frontend logic depending on the user's role**
    ([#76](https://github.com/Schroedinger-Hat/certo/issues/76)). Strapi's
    built-in `me` controller (`@strapi/plugin-users-permissions`) runs the
    requested `populate` through `strapi.contentAPI.validate.query`, which
    doesn't allow `role` by default - so the request was rejected before ever
    checking the (correctly configured) Authenticated-role permissions. Fixed
    with a `strapi-server.ts` extension
    (`src/extensions/users-permissions/strapi-server.ts`) that overrides `me`
    to fetch the role directly via `strapi.db.query(...).findOne({ populate:
    ['role'] })`, bypassing that unrelated validation layer, and manually
    strips the private fields (`password`, `resetPasswordToken`,
    `confirmationToken`) that the default controller's sanitizer would have
    removed.

23. **[Fixed] Frontend checked a Strapi role called "Issuer" that
    can never exist, making `/issue` unreachable for everyone**
    ([#77](https://github.com/Schroedinger-Hat/certo/issues/77)).
    `stores/auth.ts`'s `isIssuer` checked `user.role.name === 'issuer'` - the
    Strapi Users & Permissions role - but a fresh instance only ever has the
    built-in `Public`/`Authenticated` roles; issuer-ness is actually the
    `Profile.profileType` field (`Issuer`/`Recipient`/`Both`). Fixed to check
    `profile.value?.profileType` instead. This depended on item 22 being
    fixed first in practice, since without it `/api/users/me` calls that
    populate `role` 403 during session restore.

24. **New: boot-time warning if the seeded default admin credentials
    are still active.** #78 flagged that `admin@certo.com`/`certo` (the
    README's documented dev credentials) end up live in production
    deployments that don't explicitly set `NODE_ENV=production` (the only
    thing that makes `seedDevelopmentData()` skip seeding). Added
    `bootstrap/default-credentials-warning.ts`, run unconditionally on every
    boot (not gated by environment): if `admin@certo.com` exists and its
    password still validates against the seeded default, it logs a loud
    `strapi.log.warn` block. This is advisory only — it doesn't rotate the
    password or block startup, since a self-hoster may be mid-setup.

## Enterprise readiness: Import/Export, Backup/Restore, Monitoring

Continues the audit log + RBAC work above (item 5) — multi-tenancy remains
deliberately deferred (see item 5's rationale) — with three more
production-readiness items: self-service data portability, full-instance
backup/restore, and basic monitoring.

25. **New: self-service data export/import, per profile.**
    `api::profile.profile`'s new `exportMyData`/`importMyData` actions
    (`GET`/`POST /profiles/me/export`, `/profiles/me/import`) let an
    authenticated issuer take *all* their own data with them - achievements
    they created, credentials they issued or received, and evidence - as one
    JSON bundle, and re-import it (achievements/credentials they issued
    only, never `credentialsReceived`) into a fresh instance under the same
    account. Distinct from the pre-existing
    `credential.import`/`credential.export` actions and
    `open-badge.ts`'s `importCredential()`, which handle ingesting/emitting a
    single *externally-issued* OB3 VC - naming was deliberately kept
    separate to avoid confusing the two. Import is idempotent: achievements/
    credentials/evidence already present (matched by their natural unique
    key - `achievementId`/`credentialId`/`evidenceId`) are skipped, never
    duplicated or overwritten. Implementation:
    `api/profile/services/data-portability.ts`; recipient resolution reuses
    `credential.ts`'s find-or-create-by-email logic, extracted into its own
    `findOrCreateRecipientProfile()` method rather than duplicated.

26. **New: full-instance backup/restore (`npm run backup`/`restore`).**
    DB-native rather than a generic content-type JSON dump - `pg_dump`/
    `pg_restore` for Postgres, a plain file copy for sqlite - plus
    `public/uploads`, all into one timestamped directory under `backups/`
    (gitignored). Deliberately does **not** boot a full Strapi instance like
    `scripts/fresh-install.js` does: backup/restore only need the raw
    `DATABASE_*` connection config (read the same way
    `config/database.ts` does, via `dotenv`), not the ORM - and for sqlite
    specifically, booting Strapi would mean holding the very DB file open
    that restore is about to overwrite. `restore.js` refuses to run without
    an explicit `--yes` (it's destructive: `pg_restore --clean --if-exists`
    drops existing objects first; sqlite restore overwrites the live file
    outright). MySQL isn't supported - nothing in this repo's docker-compose/
    docs uses it. The backend `Dockerfile` now installs
    `postgresql16-client` (matching the `postgres:16` image in
    `docker-compose.yml`) so `docker exec certo_backend npm run backup`
    works without extra setup.

27. **[Fixed] `docker-compose.yml`'s `backend` service had no volume
    for `public/uploads` at all.** Every container recreation silently
    deleted all uploaded media (achievement/profile images) - found while
    scoping what a backup actually needs to capture, since there was nothing
    durable to back up otherwise. Fixed by adding a named `uploads-data`
    volume mounted at `/app/public/uploads`.

28. **New: monitoring (`/api/health`, `/api/metrics`).** `/api/health`
    is a richer JSON DB-connectivity check than Strapi's built-in `/_health`
    (204, no body), which is unchanged and still present. `/api/metrics` is
    a `prom-client`-backed Prometheus endpoint: default Node process metrics
    plus four counters (`certo_credentials_issued_total`,
    `certo_credentials_revoked_total`,
    `certo_credentials_verified_total{result}`,
    `certo_achievements_created_total`) incremented at the same call sites
    already touched by item 5's audit log. Both routes are unauthenticated
    by design (Prometheus/health-check convention, same as `/_health`) -
    self-hosters should restrict `/api/metrics` at the reverse proxy, not
    app auth. Neither is tied to a content type, so both are registered via
    `strapi.server.routes()` inside `src/index.ts`'s `register()` hook
    rather than a fake content-type-less `api/` folder - this has to happen
    in `register()`, not `bootstrap()`, since Strapi finalizes routing
    (`server.initRouting()`) partway through its own `bootstrap()`, before
    this app's `bootstrap({ strapi })` hook ever runs. See
    [monitoring.md](./monitoring.md).

29. **New: structured logging (`LOG_FORMAT_JSON`) with per-request
    correlation.** Closes out the last open Enterprise Readiness item
    (multi-tenancy remains deliberately deferred per item 5). New
    `config/logger.ts` — Strapi's standard "every file in `config/` becomes
    a config key" convention, no monkey-patching — switches from the default
    colored `prettyPrint()` to `winston.format.json()` when
    `LOG_FORMAT_JSON=true`, off by default so local dev is unaffected. A new
    `src/middlewares/request-id.ts` (`global::request-id`, first in
    `config/middlewares.ts` so its context covers the whole request
    lifecycle) assigns a correlation id per request and runs the rest of the
    chain inside an `AsyncLocalStorage` context
    (`src/utils/request-context.ts`); `config/logger.ts`'s format reads that
    same store and attaches `requestId` to **every** log line produced
    during the request — including `strapi::logger`'s own access-log line —
    with no changes needed to any of the ~40 existing `strapi.log.*()` call
    sites (item 20's single-interpolated-string convention is untouched).
    See [logging.md](./logging.md).

30. **New: Helm chart + reverse-proxy examples.** Closes Phase 1's
    remaining deployment items (`docs/architecture.md` previously stated
    plainly that no Kubernetes manifests, Helm charts, or Terraform existed
    - Terraform remains genuinely out of scope, a separate Phase 4 item).
    New `.github/workflows/docker-publish.yml` builds and pushes
    backend/frontend images to `ghcr.io/schroedinger-hat/certo-{backend,
    frontend}` on push to `main` and on version tags, using the workflow's
    own `GITHUB_TOKEN` (no new secrets). New `helm/certo/` mirrors
    `docker-compose.yml`'s services/env vars exactly rather than inventing
    a different shape: an optional bundled Postgres (a plain StatefulSet,
    not a Bitnami chart dependency, to avoid taking on an external chart's
    version churn), a PVC for uploads matching the docker-compose volume
    from item 27, readiness/liveness probes on `/api/health` (item 28's
    recommended target), and secrets that auto-generate on first install
    and persist across `helm upgrade` via Helm's `lookup` function so
    upgrading never rotates a running instance's credentials out from under
    it (verified end-to-end against a real local `kind` cluster - install,
    confirm `JWT_SECRET` byte-identical after `helm upgrade`, confirm the
    single-replica-Postgres StatefulSet reaches `Running` and its PVC
    binds). Also new: `docs/examples/nginx.conf.example`,
    `Caddyfile.example`, and a Traefik docker-compose label overlay for the
    non-Kubernetes deployment path. See [kubernetes.md](./kubernetes.md) and
    [reverse-proxy.md](./reverse-proxy.md).

31. **New: `/api/v1` versioning, closing out Phase 1.** Previously
    documented as "deliberately deferred since it's a breaking change to
    every route the frontend calls" (`docs/backend.md`) - that framing
    assumed versioning meant migrating every route/consumer at once. It
    doesn't: Strapi mounts its entire content-API router under one global
    prefix (`config/api.ts`'s `rest.prefix`, read at
    `@strapi/core/dist/services/server/content-api.js:7`), so every route
    already shares a single prefix with no per-file registration. New
    `src/middlewares/api-version-alias.ts` (`global::api-version-alias`,
    first in `config/middlewares.ts`) rewrites an incoming `/api/v1/*` path
    to `/api/*` before Strapi's router matches it (confirmed via Koa's own
    `ctx.path` setter that this correctly updates the underlying URL,
    preserving the query string, for `@koa/router` to re-match) - so
    `/api/v1/*` becomes a transparent, zero-maintenance alias for every
    current *and future* route, with `/api/*` continuing to work unchanged
    since the frontend (`api-client.ts`) and the Netlify OG-image function
    both hardcode literal `/api/...` paths and were deliberately left
    untouched. See [backend.md](./backend.md).

32. **New: S3-compatible upload provider.** `config/plugins.ts`'s
    `upload.config` was hardcoded to `provider: 'local'` - the only storage
    option, and a real problem for the Helm chart from item 30, whose
    `backend.uploads` PVC is `ReadWriteOnce` and can't be shared across
    `backend.replicaCount > 1`. New `UPLOAD_PROVIDER=s3` env var switches to
    `@strapi/provider-upload-aws-s3` (added as a dependency); confirmed by
    reading the package's own README and `dist/index.js` (not guessing) that
    its `providerOptions.s3Options` is spread directly into `new S3Client()`,
    so `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE` (unset for real AWS) make it work
    with any S3-compatible service, exactly as the package's own "S3
    compatible services" doc section describes for Scaleway. No CSP change
    needed - `config/middlewares.ts`'s `img-src`/`media-src` already include
    a bare `*`. Verified end-to-end against a real local MinIO container
    (not just config review): uploaded a file through Strapi's actual
    upload API, confirmed the object landed in the bucket, and confirmed
    the returned URL served the exact uploaded content back; also confirmed
    `UPLOAD_PROVIDER` unset still uses local disk exactly as before. See
    [self-hosting.md](./self-hosting.md#or-skip-local-disk-entirely-s3-compatible-storage).

33. **New: QR codes on certificates.** The backend-generated
    certificate SVG (`GET /credentials/:id/certificate`,
    `utils/certificate-template.ts`) now embeds a QR code (bottom-right
    corner, the one part of the 800x650 layout previously left empty)
    linking to the credential's public verification page, and the frontend
    credential detail page (`pages/credentials/[id]/index.vue`) renders the
    same QR client-side (`onMounted`, matching the existing
    `navigator.share()` pattern). Both use the new `qrcode` npm package
    (added to both `src/backend/package.json` and
    `src/frontend/package.json` independently - no monorepo tooling shares
    dependencies between them). The backend's QR URL is built from
    `strapi.config.get('frontend.url', ...)` (the same self-hosting-aware
    config `credential.ts` already uses for notification emails) +
    `credential.credentialId`, not a hardcoded production URL. Verified
    end-to-end, not just code review: decoded the actual rendered QR from a
    real certificate SVG with a QR decoder library (`jsqr` against a
    `rsvg-convert`-rendered PNG) and confirmed it resolves to the exact
    expected `/credentials/<credentialId>` URL; loaded the frontend detail
    page in a real (Playwright) browser and confirmed the QR renders with a
    valid image and the same URL underneath.

    In passing: the frontend's `shareableUrl` (which this QR reuses) is
    built from a hardcoded `WEBSITE_URL` constant
    (`constants/index.ts`), not an env var - a pre-existing self-hosting
    gap this feature inherits but doesn't fix, since fixing it was out of
    scope here.
