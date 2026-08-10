# Issue Credential

Issue an Open Badges 3.0 credential to a recipient via Certo.

## API

```
POST /api/credentials/issue
Authorization: Bearer {api-token}
Content-Type: application/json

{
  "data": {
    "achievementId": 1,
    "recipient": { "email": "alice@example.com", "name": "Alice" },
    "expirationDate": "2027-12-31"
  }
}
```

## Response

```json
{
  "credentialId": "urn:uuid:abc-123",
  "id": 42
}
```

## MCP Tool

`issue_credential` — available via `@certo/mcp`

```json
{
  "achievement_id": 1,
  "recipient_email": "alice@example.com",
  "recipient_name": "Alice",
  "expiration_date": "2027-12-31"
}
```

## Prerequisites

1. An API token with write permissions (Certo admin → Settings → API Tokens)
2. An existing achievement/badge definition (`achievementId`)

## Notes

- The recipient receives an email notification after issuance
- `expirationDate` is optional; omit for non-expiring credentials
- Use `POST /api/credentials/batch-issue` for issuing to multiple recipients at once
