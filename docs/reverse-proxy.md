# Reverse Proxy Examples

For a `docker-compose` deployment (see [self-hosting.md](./self-hosting.md))
going beyond `localhost` — terminating TLS and routing a real domain to the
frontend/backend containers. If you're deploying to Kubernetes instead, use
the chart's own `ingress.yaml` (see [kubernetes.md](./kubernetes.md)) rather
than these.

All three route the same way: `/api` and `/admin` go to the backend
(Strapi's content API and admin panel), everything else goes to the
frontend (Nuxt).

**Whichever you use, set `CORS_ALLOWED_ORIGINS` on the backend to match your
public hostname** — see
[self-hosting.md#cors-allow-your-own-domain](./self-hosting.md#cors-allow-your-own-domain).
Without it, browser requests from your real domain will be rejected by the
backend's CORS check even though the proxy itself works fine.

## Nginx

[examples/nginx.conf.example](./examples/nginx.conf.example) — assumes
you're managing TLS certs yourself (e.g. via `certbot`). Drop it in your
Nginx `sites-available`/`conf.d`, adjust the hostname and cert paths, reload.

## Caddy

[examples/Caddyfile.example](./examples/Caddyfile.example) — simplest
option if you don't already have a proxy: Caddy provisions and renews
Let's Encrypt certificates automatically, no cert paths to manage.

## Traefik

[examples/docker-compose.traefik.example.yml](./examples/docker-compose.traefik.example.yml)
— an overlay to merge into the root `docker-compose.yml`
(`docker compose -f docker-compose.yml -f docker-compose.traefik.example.yml up`),
since Traefik is normally configured via container labels rather than a
static file. Also provisions Let's Encrypt certs automatically.
