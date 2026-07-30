# Known Issues & Dev Notes

Things found while documenting the system that are broken, stubbed, inconsistent,
or otherwise worth knowing before making claims (production-readiness,
security, "how does X work") elsewhere. Grouped by severity/theme, not by file.

## Security-relevant

1. **Credential proof verification is not cryptographic.**
   `verification.ts`'s `verifyProof()` only checks structural fields (type,
   dates, presence of a value) — it never actually verifies the JWS signature
   against the issuer's public key. The code comments say so explicitly. A
   structurally well-formed but fake/unsigned proof currently passes
   verification. See [open-badges.md](./open-badges.md#verification).

2. **Signing silently degrades if the key is missing.**
   `credential.ts`'s `generateProof()` catches any signing error (including a
   missing `ED25519_PRIVATE_KEY_PKCS8`) and falls back to a fake proof
   (`proofValue: "z" + <random>`) instead of failing the issuance. A credential
   issued in this state has no real signature but looks the same as one that
   does, and issuance succeeds either way.

3. **A real Ed25519 dev private key is committed to the repo**
   (`ed25519-private.pem` / `ed25519-public.pem` at the repo root), and
   `docker-compose.yml` hardcodes a default base64 PKCS8 value for
   `ED25519_PRIVATE_KEY_PKCS8` directly in the compose file. Fine for local dev,
   but make sure any real deployment generates its own key and never reuses
   these values.

4. **External-credential proof verification is a stub too.**
   `open-badge.ts`'s `validateExternalCredential()` sets
   `const proofVerified = true` unconditionally — importing/validating a
   third-party OBv3 credential doesn't actually check its signature either.

5. **Several controller actions bypass Strapi's permission system in code**
   rather than through the role/permission model — e.g. `credential.issue` sets
   `ctx.state.auth = { strategy: { name: 'public' } }` to disable the auth
   check, and `achievement.create` calls `entityService` directly to bypass
   permission checks. Don't assume permissions shown in the Strapi admin UI
   fully describe what's actually enforced.

6. **Revocation lists aren't wired into verification.** The `revocation-list`
   content type exists (StatusList2021-style), but `verifyCredential()` only
   ever checks the credential's own `revoked` boolean — a revocation list entry
   would have no effect on verification today. `checkStatusInList` is also a
   simplified, non-bitstring implementation.

## Correctness / config bugs

7. **`SMTP_*` env vars have no effect.** `config/plugins.ts` hardcodes Ethereal
   SMTP credentials directly in source instead of reading `env('SMTP_HOST')`
   etc. This means `docker-compose.yml`'s `SMTP_HOST=mailhog` /
   `SMTP_PORT=1025` — intended to route dev email through the Mailhog
   container — currently does nothing; mail goes to Ethereal regardless. See
   [strapi-and-credentials.md](./strapi-and-credentials.md#the-email-provider-is-effectively-hardcoded).

8. **Backend Dockerfile boots in dev mode.** `src/backend/Dockerfile` builds
   with `npm run build` but starts the container with `CMD ["npm", "run", "develop"]`
   (Strapi dev mode), not `npm run start`. It also overwrites
   `config/middlewares.js` with a minimal placeholder during the build step,
   discarding the real CORS/CSP config from `config/middlewares.ts` in the
   built image. Don't treat this Dockerfile as production-ready without fixing
   both.

9. **Two parallel permission-bootstrap implementations**: `src/bootstrap.ts`
   and `src/bootstrap/permissions-setup.ts`/`.js` do overlapping work. Neither
   appears to call the other — likely redundant, worth consolidating rather
   than treating as two intentional layers.

10. **`notification.ts`'s `sendBadgeIssuedEmail` is dead code.** It builds a
    richer email (with an inline certificate image) but is never called
    anywhere in the codebase — confirmed by search. The real issuance flow
    (`credential.ts`) uses a plainer template
    (`templates/credential-issuance.ts`). If you're trying to find "why doesn't
    the certificate image show up in the issuance email," this is why — that
    code path never runs.

11. **Routing overlap in the credential API.** `credential-public.ts` defines
    `GET /api/credentials/:id`, which Strapi's core router would already
    generate from the content-type schema; `credential-fallback.ts` exists
    explicitly "as a last resort" for public listing. Signs of prior
    permission/routing struggles rather than a single clean source of truth per
    route — check both files before assuming which one actually serves a given
    request.

## Doc / metadata inconsistencies

12. **License conflict**: root `LICENSE` is AGPL-3.0 (and the README says so),
    but `docs/fresh-install-implementation.md` claims MIT. Needs reconciling —
    don't copy the MIT claim forward.

13. **Default seed credentials differ between docs**: README says
    `admin@certo.com` / `certo`; `docs/fresh-install-implementation.md` says
    `admin@certo.com` / `Admin123!` (plus a separate
    `issuer@certo.com` / `Issuer123!`). Check `scripts/fresh-install.sh` /
    `src/backend/scripts/fresh-install.js` directly if you need the actual
    current values rather than trusting either doc.

14. **`CONTRIBUTING.md` references a `frontend/` directory** that doesn't exist
    (it's `src/frontend/`).

15. **`.cursorrules` (repo root) describes an unrelated Next.js 15/React 19/
    Vercel AI SDK stack** — it's an unedited generic template, not real
    architecture guidance for this project. `.cursor/rules/vue.mdc` is the
    relevant one (Nuxt3/Vue3/UnoCSS/UnaUI/Strapi5), though it also ends
    mid-sentence, suggesting it too was assembled from a template and never
    finished.

## Minor / cleanup

16. Two empty, unreferenced scaffold directories exist at
    `src/frontend/src/frontend/` and `src/frontend/src/frontend-una/` — not used
    by `nuxt.config.ts`. Safe to delete.

17. `netlify/functions/og-credential/` ships its own `package.json`/lockfile and
    (per the exploration pass) a large vendored `node_modules` — worth checking
    it's actually gitignored.

18. `nuxt-gtag` ships with a hardcoded GA4 measurement ID and a `TODO` comment
    to replace it — flag before treating analytics as configured per-deployment.

19. Backend has **no automated test suite** at all (no Jest/Vitest config, no
    spec files) and the only CI workflow
    (`.github/workflows/frontend/autofix.yml`) just runs `eslint --fix` on the
    frontend — nothing builds, type-checks, or tests either app in CI today.
