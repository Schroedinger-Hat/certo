# Scripts Directory

This directory contains utility scripts for the Certo Strapi backend.

## Fresh Install Script

The `fresh-install.js` script provides a complete setup for a new Certo Strapi instance.

### What it does

The fresh install script sets up:

1. **Admin User**
   - Email: `admin@certo.com`
   - Password: `Admin123!`
   - Full administrative access

2. **Issuer Profile**
   - Organization: "Certo Demo Organization"
   - Email: `issuer@certo.com`
   - Profile type: Issuer
   - Complete with DID, URL, and contact information

3. **Issuer User**
   - Same email as issuer profile: `issuer@certo.com`
   - Password: `Issuer123!`
   - Authenticated user role

4. **Sample Achievement**
   - Name: "Web Development Fundamentals"
   - Includes skills (HTML, CSS, JavaScript)
   - Alignment with web standards
   - Created by the issuer profile

5. **Sample Credential**
   - Name: "Web Development Fundamentals Certificate"
   - Issued by the issuer profile
   - Recipient: Same as issuer (for demo purposes)
   - Valid for 1 year
   - Includes cryptographic proof

6. **API Permissions**
   - Public access to read achievements, profiles, credentials
   - Authenticated user access to create/update content
   - Proper permissions for all custom endpoints

### Usage

#### Option 1: Using npm script
```bash
cd src/backend
npm run fresh-install
```

#### Option 2: Direct execution
```bash
cd src/backend
node scripts/fresh-install.js
```

#### Option 3: Docker environment
```bash
# Start the backend container
docker-compose up backend -d

# Run the script inside the container
docker exec -it certo_backend npm run fresh-install
```

### Prerequisites

1. **Database**: PostgreSQL must be running and accessible
2. **Environment**: All required environment variables must be set
3. **Dependencies**: All npm dependencies must be installed

### Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=certo
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# JWT Secrets
JWT_SECRET=your-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-api-token-salt

# URLs
FRONTEND_URL=http://localhost:3000
PUBLIC_URL=http://localhost:1337
```

### What happens after installation

After running the fresh install script, you'll have:

1. **Access to Admin Panel**: http://localhost:1337/admin
   - Login with `admin@certo.com` / `Admin123!`

2. **API Endpoints Available**:
   - Profiles: `GET /api/profiles`
   - Credentials: `GET /api/credentials`
   - Achievements: `GET /api/achievements`
   - Verification: `POST /api/credentials/verify`

3. **Sample Data**:
   - 1 issuer profile
   - 1 sample achievement
   - 1 sample credential
   - 2 users (admin + issuer)

### Troubleshooting

#### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Permission Errors**
   - Make sure the script has write permissions
   - Check if Strapi is running in the correct mode

3. **Duplicate Entry Errors**
   - The script is idempotent and will skip existing entries
   - This is normal behavior

#### Reset Everything

To completely reset and start fresh:

```bash
# Stop containers
docker-compose down

# Remove volumes (this will delete all data)
docker-compose down -v

# Start fresh
docker-compose up -d

# Run fresh install
docker exec -it certo_backend npm run fresh-install
```

### Customization

You can modify the `CONFIG` object in `fresh-install.js` to customize:

- Admin user credentials
- Issuer organization details
- Sample achievement and credential data
- Default passwords and emails

### License Information

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) — see the root `LICENSE` file. If you make any changes to the codebase, please consider contributing back to the repository:

- Repository: https://github.com/Schroedinger-Hat/certo
- Issues: https://github.com/Schroedinger-Hat/certo/issues
- Pull Requests: https://github.com/Schroedinger-Hat/certo/pulls

### Security Notes

⚠️ **Important**: The default passwords in this script are for development/demo purposes only. In production:

1. Change all default passwords immediately
2. Use strong, unique passwords
3. Enable two-factor authentication
4. Regularly rotate credentials
5. Follow security best practices

### Next Steps

After running the fresh install:

1. **Explore the Admin Panel**: Navigate to http://localhost:1337/admin
2. **Test API Endpoints**: Use tools like Postman or curl to test the API
3. **Verify Credentials**: Test the credential verification endpoint
4. **Customize Content**: Add your own achievements and credentials
5. **Set Up Frontend**: Configure the frontend to connect to this backend

### Support

If you encounter issues:

1. Check the [main project README](../../README.md)
2. Review the [permissions-fix.md](../permissions-fix.md) for common permission issues
3. Open an issue on GitHub with detailed error information
4. Check the Strapi logs for more detailed error messages 