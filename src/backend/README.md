# Certo Backend

This is a Strapi TypeScript backend for the Certo application, a digital certificate platform built on the Open Badges 3.0 standard.

## Features

- Full Open Badges 3.0 implementation
- Verifiable Credentials support
- Certificate issuance and verification
- User profiles and credential management
- RESTful API for credential operations
- TypeScript support
- Custom controllers and services
- Admin panel customization

## API Endpoints

### Credentials

- `GET /api/credentials` - Get all credentials (authenticated)
- `GET /api/credentials/:id` - Get a specific credential
- `POST /api/credentials` - Create a new credential (authenticated)
- `PUT /api/credentials/:id` - Update a credential (authenticated)
- `DELETE /api/credentials/:id` - Delete a credential (authenticated)
- `POST /api/credentials/issue` - Issue a new credential
- `GET /api/credentials/:id/verify` - Verify a credential's authenticity
- `POST /api/credentials/validate` - Validate an external credential
- `GET /api/credentials/:id/export` - Export a credential in Open Badge format
- `POST /api/credentials/import` - Import a credential
- `POST /api/credentials/:id/revoke` - Revoke a credential
- `GET /api/credentials/:id/certificate` - Get a credential's certificate image

### Profiles

- `GET /api/profiles/me` - Get the current user's profile
- `GET /api/profiles/:id` - Get a specific profile
- `GET /api/profiles/:id/issued-credentials` - Get credentials issued by a profile
- `GET /api/profiles/:id/received-credentials` - Get credentials received by a profile
- `PUT /api/profiles/:id` - Update a profile

### Achievements

- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/:id` - Get a specific achievement
- `GET /api/achievements/:id/credentials` - Get credentials for an achievement
- `POST /api/achievements` - Create a new achievement
- `PUT /api/achievements/:id` - Update an achievement
- `DELETE /api/achievements/:id` - Delete an achievement

### Revocation

- `GET /credentials/:credentialId/status` - Check if a credential has been revoked

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 6.0.0
- PostgreSQL (recommended for production)

### Installation

1. Navigate to the backend directory:
   ```
   cd src/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run develop
   ```

4. Access the admin panel at: http://localhost:1337/admin

### Environment Variables

The application uses various environment variables for configuration. 
In a production environment, make sure to set:

- `HOST` - Host name (default: 0.0.0.0)
- `PORT` - Port to run on (default: 1337)
- `APP_KEYS` - Secret keys for the app
- `API_TOKEN_SALT` - Salt for API tokens
- `ADMIN_JWT_SECRET` - JWT secret for admin
- `JWT_SECRET` - JWT secret for API
- `DATABASE_CLIENT` - Database client (default: sqlite, recommend postgres for production)
- `DATABASE_URL` - Database connection URL (for postgres/mysql)
- `FRONTEND_URL` - URL to the frontend application (for email links)
- `EMAIL_PROVIDER` - Email provider configuration (for sending certificate notifications)

## Working with Open Badges 3.0

The backend implements the [Open Badges 3.0 specification](https://www.imsglobal.org/spec/ob/v3p0/) and [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/).

Key components:

- **Credential Service**: Handles credential lifecycle (issuance, verification, revocation)
- **OpenBadge Service**: Transforms internal data to Open Badge 3.0 format
- **Verification Service**: Validates the authenticity of credentials
- **Revocation Service**: Manages credential revocation status

## Permissions Setup

Strapi uses a role-based permission system. For Certo, you'll need to configure:

1. Public routes (credential verification, public badge viewing)
2. Authenticated routes (user credential management)
3. Admin routes (achievement and issuer management)

See `permissions-fix.md` for detailed instructions on setting up the correct permissions.

## Development

### Custom API Creation

To create a new API:

```bash
npx strapi generate
```

Select "api" from the menu and follow the interactive prompts.

### Adding a Custom Controller Method

Create a custom controller method by extending the core controller:

```typescript
export default factories.createCoreController('api::yourmodel.yourmodel', ({ strapi }) => ({
  async customMethod(ctx) {
    // Your custom logic
  },
}))
```

## Deployment

To build the Strapi application for production:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## License

This project is licensed under the GNU Affero General Public License v3.0. See the LICENSE file for details.

## Resources

- [Open Badges 3.0 Specification](https://www.imsglobal.org/spec/ob/v3p0/)
- [Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [Strapi Documentation](https://docs.strapi.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
