# Kubernetes / Helm

A Helm chart at [`helm/certo/`](../helm/certo/) — mirrors
`docker-compose.yml`'s services and env vars exactly (backend, frontend, and
an optional bundled Postgres), rather than inventing a different
configuration shape for this deployment path.

## Prerequisites

- A Kubernetes cluster and `helm` (v3).
- Backend/frontend images published to
  `ghcr.io/schroedinger-hat/certo-backend`/`certo-frontend` — built and
  pushed automatically by `.github/workflows/docker-publish.yml` on every
  push to `main` (tags: `latest`, the git short sha, and version tags on
  release). If you've forked this repo, that workflow publishes to your
  fork's own GHCR namespace instead — update `values.yaml`'s
  `image.repository` fields to match, or build/push your own images
  manually from `src/backend/Dockerfile`/`src/frontend/Dockerfile`.

## Install

```bash
helm install certo helm/certo
```

That's it for trying it out — any secret left blank in `values.yaml`
(`secrets.*`, `postgresql.password`) is auto-generated on first install and
**persists across `helm upgrade`** (read back from the existing Secret via
Helm's `lookup` function, not regenerated), so upgrading never locks you out
of a running instance. Retrieve them if you need to record them elsewhere:

```bash
kubectl get secret certo-secrets -o yaml
```

**For a real deployment, pin your own values** — via `--set` or a
`values.yaml` override — for every field under `secrets:`, and don't rely on
the generated defaults long-term.

## Values overview

| Key | What it controls |
|---|---|
| `backend.image` / `frontend.image` | Repository, tag, pull policy for each image |
| `backend.env.corsAllowedOrigins` | Same as the `CORS_ALLOWED_ORIGINS` env var — see [self-hosting.md](./self-hosting.md) |
| `backend.env.logFormatJson` | Same as `LOG_FORMAT_JSON` — see [logging.md](./logging.md) |
| `backend.uploads` | PVC for uploaded media (achievement/profile images) — mirrors docker-compose's `uploads-data` volume |
| `s3.*` | S3-compatible upload storage (AWS S3, MinIO, R2, etc.) — the alternative to `backend.uploads` required for `backend.replicaCount > 1`. See [self-hosting.md](./self-hosting.md#or-skip-local-disk-entirely-s3-compatible-storage) |
| `postgresql.enabled` | `true`: bundled single-replica StatefulSet (testing/small deployments). `false`: point `postgresql.external.host`/`port` at your own managed instance |
| `ingress.*` | Host, TLS, ingress class, and annotations (e.g. for cert-manager) |

## Scaling recommendations

- **Backend and frontend are stateless** and can be scaled via
  `backend.replicaCount`/`frontend.replicaCount` — *except* that
  `backend.uploads.enabled` (the default) provisions a `ReadWriteOnce` PVC,
  which only one pod can mount at a time. Running more than one backend
  replica requires either a storage class that supports `ReadWriteMany`, or
  (the recommended path) setting `backend.uploads.enabled: false` and
  `s3.enabled: true` — verified end-to-end against a real MinIO instance:
  uploads correctly land in the bucket instead of a pod-local volume.
- **The bundled Postgres is not horizontally scalable** — it's a
  single-replica StatefulSet for convenience, the same tradeoff
  `docker-compose.yml` already makes. For a production deployment, set
  `postgresql.enabled: false` and point at a real managed Postgres (RDS,
  Cloud SQL, a properly-replicated cluster you operate yourself, etc).

## Probes

The backend's readiness/liveness probes target `GET /api/health` (see
[monitoring.md](./monitoring.md) — a DB-connectivity check, the documented
choice for orchestrator probes). The frontend has no dedicated health route,
so its probes just check `GET /`.
