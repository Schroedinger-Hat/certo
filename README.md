# Certo

Certo is a comprehensive digital credentials platform for issuing, managing, and verifying badges and certificates based on the [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/) specification and the [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) data model.

![Certo Open Graph Image](./src/frontend/public/og-default.png)

## Overview

Certo is an open-source platform that enables organizations and individuals to issue verifiable digital credentials (badges and certificates) following global standards. Whether you're running educational programs, workshops, certification courses, or need to recognize achievements, Certo provides a complete solution for creating, issuing, and verifying digital credentials.

### How It Works

1. **Issuers** create badge templates (Achievements) defining what the badge represents, criteria for earning it, and associated skills
2. **Issuers** issue credentials to recipients either individually or in bulk via CSV upload
3. **Recipients** receive their credentials and can view them in their dashboard
4. **Anyone** can verify the authenticity of a credential using the public verification page
5. **Recipients** can share their verified credentials on LinkedIn and other platforms

### Standards Compliance

Certo implements:
- **Open Badges 3.0**: IMS Global Learning Consortium standard for digital credentials
- **W3C Verifiable Credentials**: Cryptographically secure and tamper-evident credentials
- **Decentralized Identifiers**: For robust identity management

### Use Cases

- **Educational Institutions**: Issue course completion certificates and academic achievements
- **Training Organizations**: Provide verifiable certificates for workshops and training programs
- **Event Organizers**: Award attendance or participation badges for conferences and meetups
- **Companies**: Recognize employee skills, certifications, and professional development
- **Open Source Communities**: Acknowledge contributions and participation
- **Professional Associations**: Issue membership credentials and professional certifications

## Features

### 🏆 Badge & Certificate Management
- **Create Achievements**: Design badge templates with customizable criteria, skills, and metadata
- **Issue Credentials**: Issue digital certificates for workshops, courses, events, and projects
- **Batch Issuance**: Upload CSV files to issue credentials to multiple recipients simultaneously
- **Role-Based Access**: Separate issuer and recipient roles with appropriate permissions

### 🔐 Verification & Security
- **Cryptographic Verification**: Verify badge authenticity using cryptographic proofs and the Verifiable Credentials model
- **Revocation Support**: Maintain revocation lists for invalidated credentials
- **Tamper-Evident**: All credentials are cryptographically signed and tamper-evident

### 📤 Sharing & Integration
- **LinkedIn Integration**: Share certificates directly on LinkedIn
- **Multiple Export Formats**: Export credentials in various formats
- **Public Verification**: Anyone can verify credential authenticity via the verification page

### 📋 Additional Features
- **Evidence Attachments**: Attach supporting evidence and narratives to credentials
- **Endorsements**: Third-party endorsement support for credentials
- **Dashboard**: View and manage all issued and received credentials
- **Open Standards**: Full compliance with Open Badges 3.0 specification

## Project Structure

```
certo/
├── src/
│   ├── backend/                # Strapi 5.x backend (TypeScript)
│   │   ├── src/
│   │   │   ├── api/            # API endpoints
│   │   │   │   ├── achievement/    # Badge templates/definitions (Open Badges 3.0)
│   │   │   │   ├── credential/     # Issued credentials/badges
│   │   │   │   ├── profile/        # User profiles (issuers & recipients)
│   │   │   │   ├── evidence/       # Evidence attachments
│   │   │   │   ├── endorsement/    # Third-party endorsements
│   │   │   │   └── revocation-list/# Credential revocation lists
│   │   │   ├── admin/          # Strapi admin customizations
│   │   │   ├── components/     # Reusable content components
│   │   │   ├── middlewares/    # Custom middlewares
│   │   │   └── utils/          # Utility functions
│   │   ├── config/             # Strapi configuration
│   │   ├── database/           # Database migrations
│   │   ├── public/             # Static files & uploads
│   │   ├── scripts/            # Utility scripts
│   │   ├── types/              # TypeScript type definitions
│   │   ├── Dockerfile          # Backend Docker configuration
│   │   └── package.json        # Backend dependencies
│   │
│   └── frontend/               # Nuxt 3 frontend (Vue 3 + TypeScript + Una UI)
│       ├── pages/              # Application pages
│       │   ├── index.vue           # Home page
│       │   ├── issue.vue           # Badge issuance (CSV upload support)
│       │   ├── verify.vue          # Credential verification
│       │   ├── dashboard.vue       # User dashboard
│       │   └── ...                 # Other pages
│       ├── components/         # Vue components
│       ├── composables/        # Vue composables
│       ├── stores/             # Pinia state management
│       ├── middleware/         # Route middleware (auth, etc.)
│       ├── api/                # API client libraries
│       ├── types/              # TypeScript types
│       ├── plugins/            # Nuxt plugins
│       ├── assets/             # CSS, images, SVG components
│       ├── public/             # Static public files
│       ├── e2e/                # Playwright E2E tests
│       ├── Dockerfile          # Frontend Docker configuration
│       └── package.json        # Frontend dependencies
│
├── netlify/                    # Netlify serverless functions
│   └── functions/
│       └── og-credential/      # Open Graph image generation
├── docker-compose.yml          # Docker Compose configuration
├── README.md                   # This file
├── LICENSE                     # AGPL-3.0 License
├── CONTRIBUTING.md             # Contribution guidelines
└── CODE_OF_CONDUCT.md          # Code of conduct
```

## Requirements

### For Docker Setup (Recommended)
- Docker and Docker Compose
- Node.js 18-22.x (for local development)

### For Local Development
- Node.js 18.x - 22.x
- npm 6.0.0 or higher
- PostgreSQL 13+ (or use SQLite for development)

### Technology Stack
- **Backend**: Strapi 5.15.0, TypeScript 5.x, Node.js 18-22.x
- **Frontend**: Nuxt 3.10+, Vue 3.4+, TypeScript 5.x, Una UI
- **Database**: PostgreSQL (production) or SQLite (development)
- **Authentication**: JWT with jose library
- **Testing**: Vitest (unit), Playwright (E2E)

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/schrodinger-hat/certo.git
cd certo
```

2. Create environment variables:

Create a `.env` file in the `src/backend` directory with the following variables:

```bash
# Required Strapi Secrets
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
APP_KEYS=your-app-keys

# Database Configuration (PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=certo
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi

# Server Configuration
HOST=0.0.0.0
PORT=1337

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

Create a `.env` file in the `src/frontend` directory:

```bash
# API Configuration
NUXT_PUBLIC_API_URL=http://localhost:1337
NUXT_PUBLIC_WEBSITE_URL=http://localhost:3000

# Optional: Google Analytics
NUXT_PUBLIC_GTAG=your-gtag-id
```

3. Start the Docker containers:

```bash
docker-compose up -d
```

This will start the backend (Strapi), frontend (Nuxt 3), and PostgreSQL database.

4. Wait for the containers to initialize. On first run, the backend will automatically:
   - Create sample data for testing
   - Configure all necessary API permissions

**Default login credentials (same for admin panel and frontend):**
- Email: `admin@certo.com`
- Password: `certo`

**Sample data includes:**
- A Strapi admin user (for the admin panel at `/admin`)
- An API user (for frontend authentication)
- A profile (configured as both Issuer and Recipient)
- A sample achievement ("Welcome to Certo")
- A sample credential/badge awarded to the admin user

**Permissions automatically configured:**
- Authenticated users can access all API endpoints (profiles, achievements, credentials, etc.)
- Public users can read and verify badges

> Note: Seed data is only created on the first run. If you need to reset the database, run `docker-compose down -v` to remove volumes, then start again.

5. Access the applications:

- Backend (Strapi Admin): http://localhost:1337/admin
- Frontend (Nuxt 3): http://localhost:3000

## Running Locally (Without Docker)

If you prefer to run the applications locally without Docker, you'll need to set up PostgreSQL separately or use SQLite for development.

### Backend (Strapi)

1. Set up your database (PostgreSQL or SQLite)
2. Create the `.env` file as described above
3. Install and run:

```bash
cd src/backend
npm install
npm run develop    # Development mode with auto-reload
# or
npm run dev        # Alternative dev command
```

The Strapi admin panel will be available at http://localhost:1337/admin

**First-time setup**: Create an admin account when prompted on first launch.

### Frontend (Nuxt 3)

1. Create the `.env` file as described above
2. Install and run:

```bash
cd src/frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Development Workflow

1. Start the backend first (it runs on port 1337)
2. Start the frontend (it connects to the backend API)
3. Create an admin account in Strapi
4. Register a user account in the frontend
5. Set user role to "issuer" in Strapi admin to issue badges

## API Documentation

The API follows the Open Badges 3.0 specification and provides both public and authenticated endpoints.

### Key Endpoints

**Public Endpoints:**
- `GET /api/credentials/:id` - Retrieve public credential data (Open Badges 3.0 format)
- `POST /api/credentials/verify` - Verify credential authenticity
- `GET /api/revocation-list/check/:id` - Check if a credential is revoked

**Authenticated Endpoints:**
- `POST /api/achievements` - Create badge templates (issuer only)
- `POST /api/credentials/batch-issue` - Issue credentials to multiple recipients
- `GET /api/profiles/me` - Get current user profile
- `GET /api/profiles/:id/credentials` - Get user's credentials
- `POST /api/endorsements` - Create credential endorsements
- `POST /api/evidence` - Attach evidence to credentials

### Data Models

- **Achievement**: Badge template/definition (Badge Class in Open Badges 3.0)
- **Credential**: Issued badge/certificate (Badge Assertion in Open Badges 3.0)
- **Profile**: User profile (issuer or recipient)
- **Evidence**: Supporting documentation for credentials
- **Endorsement**: Third-party validation of credentials
- **Revocation List**: List of revoked credentials

For complete API documentation, access the Strapi admin panel at http://localhost:1337/admin after setup.

## Testing

### Frontend Tests

**Unit Tests (Vitest):**
```bash
cd src/frontend
npm run test:unit          # Run once
npm run test:unit:watch    # Run in watch mode
```

**End-to-End Tests (Playwright):**
```bash
cd src/frontend
npm run test:e2e
```

E2E tests cover:
- User registration and login flows
- Badge issuance workflow
- Credential verification
- Dashboard functionality
- Navigation and routing

### Backend Tests

The backend uses Strapi's testing framework. Tests can be run from the backend directory:
```bash
cd src/backend
npm test
```

## Deployment

### Docker Deployment

The easiest way to deploy Certo is using Docker Compose:

```bash
docker-compose up -d
```

This will start all required services (backend, frontend, and database) in production mode.

### Manual Deployment

#### Backend
```bash
cd src/backend
npm install
npm run build
npm start
```

#### Frontend
```bash
cd src/frontend
npm install
npm run build
npm start
```

### Environment Variables for Production

Make sure to set secure values for:
- `ADMIN_JWT_SECRET` - Strong random string for admin authentication
- `JWT_SECRET` - Strong random string for user authentication
- `APP_KEYS` - Comma-separated list of random strings
- `DATABASE_PASSWORD` - Secure database password
- Update `FRONTEND_URL` and `NUXT_PUBLIC_API_URL` with your production URLs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the LICENSE file for details.

## Acknowledgments

- [Open Badges 3.0 Specification](https://www.imsglobal.org/spec/ob/v3p0/)
- [Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [Strapi](https://strapi.io/)
- [Nuxt 3](https://nuxt.com/)
- [Una UI](https://una-ui.vercel.app/)
- [Schrödinger Hat](https://www.schrodinger-hat.it/)

## Maintainers

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/TheJoin95">
          <img src="https://github.com/TheJoin95.png" width="100px;" alt="Miki Lombardi"/>
          <br />
          <sub>
            <b>Miki Lombardi</b>
          </sub>
        </a>
        <br />
        <span>💻 Maintainer</span>
      </td>
      <td align="center">
        <a href="https://github.com/Readpato">
          <img src="https://github.com/Readpato.png" width="100px;" alt="Patrick Raedler"/>
          <br />
          <sub>
            <b>Patrick Raedler</b>
          </sub>
        </a>
        <br />
        <span>💻 Maintainer</span>
      </td>
      <td align="center">
        <a href="https://github.com/MarcoJul">
          <img src="https://github.com/MarcoJul.png" width="100px;" alt="Lorenzo Bugli"/>
          <br />
          <sub>
            <b>Marco Giuliotti</b>
          </sub>
        </a>
        <br />
        <span>💻 Maintainer</span>
      </td>
    </tr>
  </table>
</div>
