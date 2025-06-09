# Certo Frontend

This is the Next.js frontend for the Certo application, a digital certificate platform built on the Open Badges 3.0 standard.

## Features

- Modern UI built with Next.js 15 (App Router)
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Certificate management dashboard
- Badge issuance and verification
- User authentication
- Profile management
- Integration with the Certo backend API

## Pages and Functionality

- **Home** (`/`): Landing page with information about the platform
- **Dashboard** (`/dashboard`): User dashboard showing issued and received certificates
- **Login/Register** (`/login`, `/register`): Authentication pages
- **Verify** (`/verify`): Verification page for checking certificate authenticity
- **Issue** (`/issue`): Form for issuing new certificates
- **Credentials** (`/credentials`): Management of user's credentials

## Components

- **CertificateCard**: Displays certificate information with actions (verify, export, revoke)
- **BadgeVerifier**: Verifies the authenticity of badges
- **BadgeIssuanceForm**: Form for creating and issuing new badges
- **Authentication**: Components for user login, registration, and session management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend service running (see backend README)

### Installation

1. Navigate to the frontend directory:
   ```
   cd src/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:1337
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at: http://localhost:3000

## API Integration

The frontend communicates with the backend through a dedicated API client (`/src/api/api-client.ts`), which provides methods for:

- User authentication
- Certificate management (create, read, update, delete)
- Certificate verification
- Profile management
- Badge issuance and verification

## Authentication Flow

1. Users register or log in through the authentication pages
2. JWT tokens are stored securely for API calls
3. Protected routes check authentication status
4. User profiles are fetched based on authentication

## Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
docker build -t certo-frontend .
docker run -p 3000:3000 certo-frontend
```

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint**: Code linting
- **Jest/React Testing Library**: Testing (optional)

## License

This project is licensed under the MIT License.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Open Badges 3.0 Specification](https://www.imsglobal.org/spec/ob/v3p0/) 