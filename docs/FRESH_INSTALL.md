# Fresh Install Guide for Certo

This guide will help you set up a fresh installation of Certo with all the necessary configurations, sample data, and best practices.

## Quick Start

The easiest way to get started with Certo is to use our fresh install script:

```bash
# Clone the repository
git clone https://github.com/schrodinger-hat/certo.git
cd certo

# Run the fresh install script
npm run fresh-install
# or
node scripts/fresh-install.js
```

This script will:
- ✅ Check system requirements
- 🔧 Generate secure environment variables
- 📝 Create sample data setup scripts
- 📜 Display license and contribution information
- 🚀 Provide next steps for development

## What the Fresh Install Script Does

### 1. System Requirements Check
- Verifies Node.js 18+ is installed
- Confirms project structure is correct
- Validates package.json files exist

### 2. Environment Configuration
Creates a `.env` file with:
- Secure randomly generated secrets
- Database configuration
- Email settings template
- Development environment settings

### 3. Sample Data Setup
- Creates default admin user (development only)
- Generates sample profiles for testing
- Sets up sample achievements/certificates
- Configures proper permissions

### 4. License and Contribution Info
- Displays AGPL-3.0 license requirements
- Shows contribution guidelines
- Provides links to documentation

## Manual Installation (Alternative)

If you prefer to set up manually:

### 1. Install Dependencies
```bash
# Install backend dependencies
cd src/backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Strapi Configuration
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt

# Database Configuration
DATABASE_CLIENT=better-sqlite3
DATABASE_FILENAME=.tmp/data.db

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NUXT_PUBLIC_API_URL=http://localhost:1337/api

# Development Settings
NODE_ENV=development
```

⚠️ **Security Note**: Generate secure random values for all secrets. You can use the fresh install script to generate these automatically.

### 3. Start Development Servers

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Manual Start**
```bash
# Terminal 1 - Backend
cd src/backend
npm run develop

# Terminal 2 - Frontend  
cd src/frontend
npm run dev
```

### 4. Initial Setup
1. Visit http://localhost:1337/admin
2. Create your admin account
3. Configure content types and permissions
4. Start creating content!

## Default Credentials (Development Only)

If you run the fresh install script in development mode, default credentials are created:

- **Email**: admin@certo.local
- **Password**: CertoAdmin123!

⚠️ **Important**: Change these credentials immediately after first login!

## Sample Data

The fresh install script creates sample data including:

### Sample Profiles
- **John Doe** - Software Developer and Open Source Enthusiast
- **Jane Smith** - UX Designer and Digital Accessibility Advocate

### Sample Achievements
- **Open Source Contributor** - For contributions to open source projects
- **Workshop Completion** - For completing technical workshops
- **Community Leader** - For demonstrating community leadership

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `1337` |
| `APP_KEYS` | Strapi app keys | `key1,key2,key3,key4` |
| `API_TOKEN_SALT` | API token salt | `random-string` |
| `ADMIN_JWT_SECRET` | Admin JWT secret | `random-string` |
| `JWT_SECRET` | User JWT secret | `random-string` |
| `TRANSFER_TOKEN_SALT` | Transfer token salt | `random-string` |
| `DATABASE_CLIENT` | Database type | `better-sqlite3` |
| `DATABASE_FILENAME` | Database file path | `.tmp/data.db` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` |
| `NUXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:1337/api` |
| `NODE_ENV` | Environment | `development` |

### Optional Email Configuration

For password reset and notification features:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | `smtp.ethereal.email` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USERNAME` | SMTP username | `user@ethereal.email` |
| `SMTP_PASSWORD` | SMTP password | `password` |
| `SMTP_FROM` | From email address | `noreply@certo.local` |

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Check what's using the port
lsof -i :1337  # Backend
lsof -i :3000  # Frontend

# Kill the process
kill -9 <PID>
```

**Database Issues**
```bash
# Reset database (development only)
rm src/backend/.tmp/data.db
# Restart the backend
```

**Permission Errors**
```bash
# Fix file permissions
chmod -R 755 .
# Or specific directories
chmod -R 755 src/backend/.tmp
```

**Module Not Found**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or for workspaces
rm -rf src/backend/node_modules src/frontend/node_modules
rm src/backend/package-lock.json src/frontend/package-lock.json
npm run install:all
```

**Frontend API Connection Issues**

If you see "API baseUrl is not set" errors in the frontend:

```bash
# Ensure environment variables are set
grep NUXT_PUBLIC_API_URL .env
# Should show: NUXT_PUBLIC_API_URL=http://localhost:1337/api

# If missing, add it to .env file
echo "NUXT_PUBLIC_API_URL=http://localhost:1337/api" >> .env

# Also create frontend-specific .env file
echo "NUXT_PUBLIC_API_URL=http://localhost:1337/api" > src/frontend/.env

# Restart the frontend
npm run dev:frontend
```

**Workspace Dependency Resolution Issues**

If you encounter errors like `Cannot find module '@strapi/strapi/package.json'`, this is a known issue with npm workspaces and Strapi 5.x. Here are solutions:

```bash
# Option 1: Use Docker (Recommended)
docker-compose up -d

# Option 2: Run services independently
# Terminal 1 - Backend
cd src/backend && npm run develop

# Terminal 2 - Frontend  
cd src/frontend && npm run dev

# Option 3: Temporarily bypass workspace (Advanced)
# This approach may require adjusting import paths
cd src/backend
npm install --no-workspace
npm run develop
```

**Note**: The workspace issue doesn't affect the fresh install script functionality or Docker-based development.

### Getting Help

If you encounter issues:

1. Check the [troubleshooting section](README.md#troubleshooting) in the main README
2. Search existing [issues](https://github.com/schrodinger-hat/certo/issues)
3. Open a new issue with:
   - Operating system and version
   - Node.js version (`node --version`)
   - Error messages and logs
   - Steps to reproduce

## License Compliance

Certo is licensed under AGPL-3.0. This means:

✅ **You can**:
- Use the software for any purpose
- Study and modify the source code
- Distribute copies
- Distribute modified versions

⚠️ **You must**:
- Include the original license and copyright notice
- Share your modifications under the same AGPL-3.0 license
- Provide source code to users of your web service
- Clearly mark any changes you made

❌ **You cannot**:
- Use this software in proprietary applications without sharing source
- Remove license notices
- Use contributors' names for endorsement

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test your changes
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Support

- 📖 [Documentation](README.md)
- 🐛 [Issues](https://github.com/schrodinger-hat/certo/issues)
- 💬 [Discussions](https://github.com/schrodinger-hat/certo/discussions)
- 🌐 [Website](https://www.schrodinger-hat.it/)

---

Made with ❤️ by [Schrödinger Hat](https://www.schrodinger-hat.it/)
