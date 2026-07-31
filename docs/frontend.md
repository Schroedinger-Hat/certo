# Frontend

`src/frontend/` — Nuxt 3.10 (Vue 3.4) + Pinia + [Una UI](https://una-ui.vercel.app/) +
UnoCSS/Tailwind. App version `1.4.0`. Other notable deps: `zod`, `jose` (JWT),
`js-cookie`, `jwt-decode`, `papaparse` (CSV, used for batch issuance), `nuqs`
(URL state), `nuxt-gtag` (Google Analytics — ships with a hardcoded GA4 ID and a
`TODO` comment to replace it), `@nuxtjs/sitemap`, `vue-i18n`.

## Folder structure

```
src/frontend/
├── pages/            # filesystem routing
├── layouts/          # single layout: default.vue
├── components/        # incl. components/__tests__ (Vitest specs)
├── stores/auth.ts     # single Pinia store
├── api/               # hand-rolled fetch clients (api-client.ts, auth-client.ts)
├── middleware/         # route-guard.ts, auth.ts
├── plugins/            # api.ts, api-client.ts, auth.ts, auth-init.client.ts, pinia-init.client.ts
├── server/api/credentials/issue.ts   # the one Nitro server-side proxy route
├── composables/, constants/, types/  # incl. types/openbadges.ts
├── e2e/                # Playwright specs
└── nuxt.config.ts
```

## Routing

Standard Nuxt file-based routing — no custom `router.ts`. Key pages:
`index.vue`, `login.vue`, `register.vue`, `forgot-password.vue`,
`reset-password.vue`, `dashboard.vue`, `issue.vue`, `profile.vue`, `verify.vue`,
`linkedin.vue`, `get-started.vue`, `credentials/[id]/index.vue`,
`auth/callback.vue` (lands after an OAuth/OIDC provider redirect — see
[oauth-setup.md](./oauth-setup.md), not end-to-end tested), plus static
legal pages and `about.vue`.

Route protection is handled by `middleware/route-guard.ts`, which reads
`useAuthStore().isAuthenticated` and redirects `/dashboard` → `/login` (and vice
versa). **Note:** this middleware returns early on the client
(`if (import.meta.client) return`), meaning the actual guard logic only runs
during server-side route resolution — worth double-checking this is the intended
behavior (it looks like it could be inverted from what you'd expect for a
client-heavy SPA-style guard) before relying on it as a security boundary.

## State management

Pinia, one store: `stores/auth.ts` (`useAuthStore`) — holds `user`, `token`,
`profile`, `isAuthenticated`, and `isIssuer` (derived from
`role.name.toLowerCase() === 'issuer'`). Auth state is persisted to
`localStorage` (token + user) **and** a `token` cookie (via `js-cookie`) so SSR
route checks have something to read. `login()`/`register()` hit Strapi's
local auth endpoints first; `loginWithOAuthToken(jwt)` (used by
`pages/auth/callback.vue`) instead hydrates the same state from a JWT
Strapi's OAuth provider callback already issued — see
[oauth-setup.md](./oauth-setup.md).

## Talking to the backend

`api/api-client.ts` defines `ApiClient`, a thin hand-rolled REST wrapper (not
Nuxt's `$fetch`/`useFetch` composables) that attaches
`Authorization: Bearer <token>` and knows Strapi's REST conventions directly
(query strings like `populate=*`, `filters[profileType][$eq]=...`). Key methods:

| Method | Endpoint |
|---|---|
| `getBadges` / `getBadge` | `/api/achievements` |
| `getIssuers` / `getIssuer` | `/api/profiles` |
| `issueBadge` | `/api/credentials/issue` (via the Nitro proxy) |
| `batchIssueBadges` | `/api/credentials/batch-issue` |
| `verifyBadge` | `/api/credentials/:id/verify` |
| `validateExternalBadge` | `/api/credentials/validate` |
| `exportCertificate` / `importCertificate` / `revokeCertificate` | credential-specific routes |
| `getIssuerKeys` | `/api/profiles/:id/keys` |
| `getCurrentUserProfile` | `/api/profiles/me` |

`ApiClient` also contains a `formatCredential`/`formatCredentials` normalizer
that branches on **Strapi v4 shape** (`{ attributes: {...} }`) vs **Strapi v5
shape** (flat) response bodies. This is the clearest example in the codebase of
frontend code that's coupled to Strapi's specific response format rather than a
stable app-level contract — relevant if you're evaluating what "swap the
backend" would actually require (see [tool-agnostic.md](./tool-agnostic.md)).

`api/auth-client.ts` (`AuthClient`) talks directly to Strapi's built-in
`users-permissions` auth endpoints: `/api/auth/local`, `/api/auth/local/register`,
`/api/users/me`.

## The one server-side route

`server/api/credentials/issue.ts` is a Nitro/h3 handler that proxies
`POST /api/credentials/issue` to Strapi, forwarding the bearer token but
explicitly **not** forwarding cookies (`credentials: 'omit'`). Every other API
call goes straight from the browser to Strapi using `NUXT_PUBLIC_API_URL` — there
is no general backend-for-frontend layer.

## Testing

- Vitest component specs in `components/__tests__/*.nuxt.spec.ts` (BadgeCard,
  BadgeIssuanceForm, BadgeVerifier, CertificateCard, ImportCertificate, Footer,
  SimpleToast) plus unit specs for `api/api-client.ts`, `api/auth-client.ts`, and
  the middleware files.
- Playwright E2E specs in `e2e/`: `about`, `home`, `index`, `login`, `register`,
  `verify`.
- Run with `npm run test:unit` / `npm run test:unit:watch` / `npm run test:e2e`.
