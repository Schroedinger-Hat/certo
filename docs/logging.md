# Logging

Off by default: local dev keeps Strapi's own colored console output
(`prettyPrint()`) untouched. Set `LOG_FORMAT_JSON=true` to switch to
structured JSON, meant for production/self-hosted deployments piping logs to
Loki, ELK, or Splunk.

## What changes

`config/logger.ts` is picked up automatically by Strapi (same convention as
`config/database.ts`) and, when `LOG_FORMAT_JSON=true`, replaces the default
format with `winston.format.json()` plus a `timestamp` field and Error
`stack` capture. Every log line — including the built-in access log
(`GET /api/credentials (12 ms) 200`) and any `strapi.log.*()` call anywhere
in the app — comes out as one JSON object, e.g.:

```json
{"level":"http","message":"GET /api/credentials (12 ms) 200","timestamp":"2026-08-05T10:00:00.000Z","requestId":"3f2a1c4e-..."}
```

## Request correlation (`X-Request-Id`)

`src/middlewares/request-id.ts` assigns a correlation id to every request —
reusing an incoming `X-Request-Id` header from your reverse proxy if
present, generating a UUID otherwise — and echoes it back as a response
header. `config/logger.ts`'s format attaches that same id to every log line
produced during that request (via `src/utils/request-context.ts`'s
`AsyncLocalStorage`), so you can grep/join a single request's log lines
across a `strapi::logger` access-log entry and any deeper `strapi.log.*()`
calls it triggered — without any of the ~40 existing call sites needing to
change.

## Shipping logs

Since output goes to stdout either way (winston's default `Console`
transport), any log shipper that tails container stdout works unmodified —
Filebeat, Fluentd/Fluent Bit, Promtail, or your platform's own log
collection. Example Promtail scrape config (assuming Docker's JSON-file log
driver):

```yaml
scrape_configs:
  - job_name: certo-backend
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
    pipeline_stages:
      - json:
          expressions:
            level: level
            requestId: requestId
```

## A note on extra log arguments

`docs/known-issues-and-dev-notes.md` (item 20) documented that Strapi's
default `prettyPrint()` format only reads `info.message` — a second object
argument passed to `strapi.log.warn('message', { extra: 'data' })` is
silently dropped. `winston.format.json()` doesn't have that limitation
(winston merges a plain-object second argument into the logged object), so
in JSON mode any such call sites will actually surface that metadata. This
doc doesn't change any existing call sites — it's just worth knowing the
two formats behave differently here if you add a new one.
