# Certo

Certo is a digital certificate platform for issuing, managing, and verifying badges and credentials based on the [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/) specification.

## Features

- Issue digital certificates for workshops, courses, events, and projects
- Verify badge authenticity using the Verifiable Credentials model
- Share certificates on social platforms like LinkedIn
- View and manage issued badges
- Support for the Open Badges 3.0 protocol

## Project Structure

```
certo/
├── src/
│   ├── backend/               # Strapi backend (TypeScript)
│   │   ├── src/
│   │   │   ├── api/           # API controllers, routes, services
│   │   │   └── extensions/    # Strapi extensions
│   │   ├── config/            # Strapi configuration
│   │   ├── public/            # Static files
│   │   ├── package.json       # Backend dependencies
│   │   ├── tsconfig.json      # TypeScript configuration
│   │   └── Dockerfile         # Backend Docker configuration
│   │
│   ├── frontend/              # Next.js frontend (TypeScript)
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router
│   │   │   └── components/    # React components
│   │   ├── public/            # Static assets
│   │   ├── package.json       # Frontend dependencies
│   │   ├── tsconfig.json      # TypeScript configuration
│   │   └── Dockerfile         # Frontend Docker configuration
│   │
│   └── shared/                # Shared code between frontend and backend
│       ├── api/               # API client
│       └── types/             # TypeScript types and interfaces
│
├── docker-compose.yml         # Docker configuration
└── README.md                  # Project documentation
```

## Requirements

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (included in Docker setup)

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/schrodinger-hat/certo.git
cd certo
```

2. Create environment variables:

Create a `.env` file in the root directory with the following variables:

```
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
```

3. Start the Docker containers:

```bash
docker-compose up -d
```

This will start the backend (Strapi), frontend (Next.js), and PostgreSQL database.

4. Access the applications:

- Backend (Strapi Admin): http://localhost:1337/admin
- Frontend: http://localhost:3000

## Running Locally (Without Docker)

If you prefer to run the applications locally without Docker:

### Backend (Strapi)

```bash
cd src/backend
npm install
npm run develop
```

### Frontend (Next.js)

```bash
cd src/frontend
npm install
npm run dev
```

## API Documentation

The API follows the Open Badges 3.0 specification. You can access the Strapi API documentation at http://localhost:1337/documentation after enabling the Swagger plugin.

Key endpoints:

- `/api/badges`: Badge management
- `/api/issuers`: Issuer management
- `/api/assertions`: Badge issuance and verification
- `/api/recipients`: Recipient management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Open Badges 3.0 Specification](https://www.imsglobal.org/spec/ob/v3p0/)
- [Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [Strapi](https://strapi.io/)
- [Next.js](https://nextjs.org/)
- [Schrödinger Hat](https://www.schrodinger-hat.it/) 