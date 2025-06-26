# Certo

Certo is a digital certificate platform for issuing, managing, and verifying badges and credentials based on the [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/) specification.

![Certo Open Graph Image](./src/frontend/public/og-default.png)

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
│   ├── backend/                # Strapi backend (TypeScript)
│   │   ├── src/                # Backend source (APIs, utils, admin, etc.)
│   │   ├── config/             # Strapi configuration
│   │   ├── public/             # Static files
│   │   ├── types/              # TypeScript types
│   │   ├── scripts/            # Utility scripts
│   │   ├── database/           # Database config/data
│   │   ├── Dockerfile          # Backend Docker configuration
│   │   ├── package.json        # Backend dependencies
│   │   ├── tsconfig.json       # TypeScript configuration
│   │   └── ...                 # Other backend files
│   │
│   ├── frontend/               # Nuxt 3 frontend (Vue 3 + Una UI)
│   │   ├── assets/             # Static assets
│   │   ├── components/         # Vue components
│   │   ├── layouts/            # Nuxt layouts
│   │   ├── middleware/         # Nuxt middleware
│   │   ├── pages/              # Nuxt pages
│   │   ├── plugins/            # Nuxt plugins
│   │   ├── stores/             # Pinia stores
│   │   ├── types/              # TypeScript types
│   │   ├── api/                # API clients
│   │   ├── public/             # Public static files
│   │   ├── nuxt.config.ts      # Nuxt configuration
│   │   ├── package.json        # Frontend dependencies
│   │   ├── tsconfig.json       # TypeScript configuration
│   │   ├── Dockerfile          # Frontend Docker configuration
│   │   └── ...                 # Other frontend files
│   │
│
├── docker-compose.yml          # Docker configuration
├── README.md                   # Project documentation
├── LICENSE                     # License file
└── docs/                       # Additional documentation
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

This will start the backend (Strapi), frontend (Nuxt 3), and PostgreSQL database.

4. Access the applications:

- Backend (Strapi Admin): http://localhost:1337/admin
- Frontend (Nuxt 3): http://localhost:3000

## Running Locally (Without Docker)

If you prefer to run the applications locally without Docker:

### Backend (Strapi)

```bash
cd src/backend
npm install
npm run develop
```

### Frontend (Nuxt 3)

```bash
cd src/frontend
npm install
npm run dev
```

## API Documentation

The API follows the Open Badges 3.0 specification. You can access the Strapi API documentation at http://localhost:1337/documentation after enabling the Swagger plugin.

Key endpoints:

- `/api/credentials`: Credential management
- `/api/profiles`: Profile management
- `/api/achievements`: Achievement management

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
