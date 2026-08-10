# Verify Credential

Verify an Open Badges 3.0 or W3C Verifiable Credential issued by Certo.

## API

```
GET /api/credentials/{id}/verify
```

No authentication required. `{id}` is the credential URN (`urn:uuid:...`) or numeric ID.

## Response

```json
{
  "verified": true,
  "credential": {
    "name": "Web Development Fundamentals",
    "issuanceDate": "2025-01-01T00:00:00.000Z",
    "expirationDate": null,
    "issuer": { "name": "Acme Corp" }
  },
  "checks": [
    { "check": "proof",       "result": "success" },
    { "check": "not_revoked", "result": "success" },
    { "check": "not_expired", "result": "success" }
  ]
}
```

## MCP Tool

`verify_credential` — available via `@certo/mcp`

```json
{ "credential_id": "urn:uuid:abc-123" }
```

## Notes

- Public endpoint — no API token needed
- Works with both URN format (`urn:uuid:...`) and numeric IDs
- `verified: false` means at least one check failed
