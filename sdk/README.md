# @certo/sdk

> Official JavaScript/TypeScript SDK for the Certo credential platform

[![npm](https://img.shields.io/npm/v/@certo/sdk)](https://www.npmjs.com/package/@certo/sdk)
[![License](https://img.shields.io/github/license/Schroedinger-Hat/certo)](LICENSE)

## Installation

```bash
npm install @certo/sdk
```

## Quick Start

```typescript
import { CertoClient } from '@certo/sdk';

// Initialize the client
const client = new CertoClient({ baseUrl: 'https://api.example.com' });

// Authenticate
await client.auth.login({
  identifier: 'admin@example.com',
  password: 'secret',
});

// List achievements (badge definitions)
const { data: achievements } = await client.achievements.list();

// Issue a credential
const { credential } = await client.credentials.issue({
  achievementId: 1,
  recipientEmail: 'alice@example.com',
  recipientName: 'Alice Smith',
});

// Verify a credential (no auth required)
const { verified } = await client.credentials.verify(credential.credential_id);
console.log(verified ? '✓ Valid' : '✗ Invalid');
```

## Features

- **Full Credential Lifecycle** — Issue, verify, revoke, renew, export, and import credentials
- **Batch Operations** — Issue thousands of credentials in a single request
- **Scheduled Issuance** — Automatically issue credentials at a future date
- **Approval Workflows** — Submit credential requests for issuer review
- **Data Portability** — Export and import entire profile data bundles
- **TypeScript** — Full type safety for all SDK methods and responses
- **Zero Dependencies** — Uses only native `fetch` API
- **Node.js & Browser** — Works in both environments

## API Reference

### Client Initialization

```typescript
const client = new CertoClient({
  baseUrl: 'https://api.example.com',        // Backend URL (default: http://localhost:1337)
  token: process.env.CERTO_API_TOKEN,        // (Optional) Bearer token
  fetch: customFetch,                        // (Optional) Custom fetch implementation
});

// Set/change token later
client.setToken('new-jwt-token');
```

### Authentication

```typescript
// Login with email/password
await client.auth.login({
  identifier: 'user@example.com',
  password: 'secret',
});

// Logout (clears token)
client.auth.logout();
```

### Achievements

```typescript
// List all achievements
const { data, meta } = await client.achievements.list({ page: 1, pageSize: 20 });

// Get single achievement
const { data } = await client.achievements.get(1);

// Create achievement (issuer/admin only)
const { data: achievement } = await client.achievements.create({
  name: 'JavaScript Expert',
  description: 'Awarded for expert-level JavaScript skills',
  tags: ['programming', 'javascript'],
});
```

### Credentials

```typescript
// List credentials
const { data: creds } = await client.credentials.list({ page: 1, pageSize: 50 });

// Get credential by ID or URN
const { data: cred } = await client.credentials.get('urn:uuid:abc123');

// Issue a credential
const { credential } = await client.credentials.issue({
  achievementId: 1,
  recipientEmail: 'alice@example.com',
  recipientName: 'Alice Smith',
  expirationDate: '2027-12-31T23:59:59.999Z',
});

// Verify a credential (public)
const result = await client.credentials.verify('urn:uuid:abc123');
if (result.verified) console.log('✓ Valid');

// Revoke a credential
await client.credentials.revoke('urn:uuid:abc123', 'Duplicate issuance');

// Batch-issue to multiple recipients
const { credentials, errors } = await client.credentials.batchIssue({
  achievementId: 1,
  recipients: [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
  ],
});

// Download certificate (PNG, JPG, or SVG)
const response = await client.credentials.certificate('urn:uuid:abc123');
const svg = await response.text();

// Export as JSON-LD Verifiable Credential
const vc = await client.credentials.export('urn:uuid:abc123');

// Import a previously exported credential
await client.credentials.import(vc);
```

### Profiles

```typescript
// Get currently authenticated user's profile
const profile = await client.profiles.me();

// Get profile by ID
const { data: profile } = await client.profiles.get(1);

// Export all profile data (achievements + credentials)
const bundle = await client.profiles.export();

// Import profile data bundle
await client.profiles.import(bundle);

// Regenerate the profile's signing key
const { identifier, publicKeyJwk } = await client.profiles.regenerateKey();
```

### Scheduled Issuance

```typescript
// List pending and completed scheduled issuances
const { data } = await client.scheduled.list();

// Schedule a credential for future issuance
const { data: scheduled } = await client.scheduled.create({
  achievementId: 1,
  recipientEmail: 'alice@example.com',
  scheduledFor: '2026-12-31T00:00:00Z',
});

// Cancel a pending scheduled issuance
await client.scheduled.cancel(scheduled.id);
```

### Credential Requests (Approval Workflows)

```typescript
// List incoming requests (issuer) or outgoing requests (recipient)
const { data } = await client.requests.list();

// Submit a credential request
const { data: request } = await client.requests.create({
  achievementId: 3,
  message: 'I completed the course in March 2026.',
});

// Approve a request (issuer action) — auto-issues the credential
await client.requests.approve(request.id, 'Great work!');

// Reject a request (issuer action)
await client.requests.reject(request.id, 'Insufficient evidence.');
```

## Error Handling

All SDK methods throw `CertoApiError` on failure:

```typescript
import { CertoApiError } from '@certo/sdk';

try {
  await client.credentials.verify('invalid-id');
} catch (err) {
  if (err instanceof CertoApiError) {
    console.error(`API error (${err.statusCode}): ${err.message}`);
    console.error('Response body:', err.body);
  }
}
```

## Examples

### Verify a credential in React

```jsx
import { CertoClient } from '@certo/sdk';
import { useState } from 'react';

const client = new CertoClient();

export function VerifyForm() {
  const [result, setResult] = useState(null);

  async function handleVerify(credentialId) {
    const result = await client.credentials.verify(credentialId);
    setResult(result);
  }

  return (
    <div>
      <input placeholder="Credential ID" onBlur={(e) => handleVerify(e.target.value)} />
      {result && (result.verified ? <p>✓ Valid</p> : <p>✗ Invalid</p>)}
    </div>
  );
}
```

### Batch issue to a CSV

```typescript
import { CertoClient } from '@certo/sdk';
import fs from 'fs';
import { parse } from 'csv-parse';

const client = new CertoClient();
await client.auth.login({ identifier: '...', password: '...' });

// Parse recipients from CSV (email, name columns)
const recipients = [];
fs.createReadStream('recipients.csv')
  .pipe(parse({ columns: true }))
  .on('data', (row) => recipients.push({ email: row.email, name: row.name }))
  .on('end', async () => {
    const { credentials, errors } = await client.credentials.batchIssue({
      achievementId: 1,
      recipients,
    });
    console.log(`Issued: ${credentials.length}, Errors: ${errors.length}`);
  });
```

### Export / backup all data

```typescript
import { CertoClient } from '@certo/sdk';
import fs from 'fs';

const client = new CertoClient();
await client.auth.login({ identifier: '...', password: '...' });

const bundle = await client.profiles.export();
fs.writeFileSync('my-certo-backup.json', JSON.stringify(bundle, null, 2));
console.log('Data exported successfully');
```

## Environment Variables

The SDK can read from environment variables:

- `CERTO_API_URL` — Backend base URL (default: `http://localhost:1337`)
- `CERTO_API_TOKEN` — Bearer token (optional)

```typescript
const client = new CertoClient({
  baseUrl: process.env.CERTO_API_URL,
  token: process.env.CERTO_API_TOKEN,
});
```

## License

AGPL-3.0. See [LICENSE](../../LICENSE).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Support

- **Issues** — [GitHub Issues](https://github.com/Schroedinger-Hat/certo/issues)
- **Docs** — [Certo Documentation](https://github.com/Schroedinger-Hat/certo/tree/main/docs)
- **Community** — [GitHub Discussions](https://github.com/Schroedinger-Hat/certo/discussions)
