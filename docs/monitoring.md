# Monitoring

Two unauthenticated endpoints, added alongside Strapi's own built-in
`/_health` (204, no body):

- `GET /api/health` — richer JSON health check:
  ```json
  { "status": "ok", "database": "ok", "timestamp": "2026-08-04T20:14:54.015Z" }
  ```
  Returns HTTP 503 with `status`/`database`: `"error"` if a `SELECT 1` against
  the configured database fails. Use this for load-balancer/orchestrator
  liveness or readiness probes.

- `GET /api/metrics` — Prometheus text exposition format: default Node.js
  process metrics (CPU, memory, event-loop lag, GC) plus four counters
  incremented at the same places `api::audit-log-entry.audit-log`'s
  `record()` is already called (see
  [known-issues-and-dev-notes.md](./known-issues-and-dev-notes.md)):
  - `certo_credentials_issued_total`
  - `certo_credentials_revoked_total`
  - `certo_credentials_verified_total{result="valid"|"invalid"}`
  - `certo_achievements_created_total`

  Implementation: `src/backend/src/monitoring/metrics.ts` (the `prom-client`
  registry + counters) and `src/backend/src/monitoring/routes.ts` (the route
  handlers). Neither endpoint is tied to a content type, so instead of a
  fake content-type-less `api/` folder, both are registered directly via
  `strapi.server.routes()` inside `src/index.ts`'s `register()` lifecycle
  hook — this has to happen in `register()`, not `bootstrap()`: Strapi
  finalizes routing (`server.initRouting()`) partway through its own
  `bootstrap()`, before this app's `bootstrap({ strapi })` hook ever runs.

## Why unauthenticated

Matches Prometheus/health-check convention (scrapers and k8s liveness/
readiness probes generally can't do app-level auth) and this app's own
`/_health`. **If you're self-hosting, restrict `/api/metrics` at your
reverse proxy or network boundary** (nginx/Traefik/firewall) rather than
relying on app auth — the same guidance applies to most Prometheus
exporters.

## Prometheus scrape config

```yaml
scrape_configs:
  - job_name: certo
    metrics_path: /api/metrics
    static_configs:
      - targets: ["your-backend-host:1337"]
```

## Grafana

A starter dashboard (the four counters above, plus process CPU/memory) is at
[examples/grafana-dashboard.json](./examples/grafana-dashboard.json) — import
it in Grafana and point it at a Prometheus data source scraping the config
above.
