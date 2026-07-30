# Fresh Install Implementation

This document describes the implementation of the fresh install script for the Certo project, addressing [GitHub Issue #57](https://github.com/Schroedinger-Hat/certo/issues/57).

## Overview

The fresh install script provides a complete setup for a new Certo Strapi instance, including:

- Admin user creation
- Issuer profile setup
- Issuer user creation (same email and organization)
- Sample credential creation
- Proper API permissions configuration
- License information and contribution guidelines

## Implementation Details

### Files Created/Modified

1. **`src/backend/scripts/fresh-install.js`** - Main fresh install script
2. **`src/backend/scripts/test-fresh-install.js`** - Test script to verify installation
3. **`src/backend/scripts/README.md`** - Documentation for the scripts directory
4. **`scripts/fresh-install.sh`** - Shell script for easy execution
5. **`src/backend/package.json`** - Added dependencies and scripts
6. **`README.md`** - Updated with fresh install instructions

### Dependencies Added

- `uuid` - For generating credential IDs in the required format

### Scripts Added

- `npm run fresh-install` - Run the fresh install script
- `npm run test-fresh-install` - Test the fresh install

## Components Created

### 1. Admin User
- **Email**: `admin@certo.com`
- **Password**: `Admin123!`
- **Role**: Admin (full administrative access)
- **Purpose**: Access to Strapi admin panel

### 2. Issuer Profile
- **Organization**: "Certo Demo Organization"
- **Email**: `issuer@certo.com`
- **Profile Type**: Issuer
- **DID**: Generated using `did:web:certo-demo.org` format
- **URL**: `https://certo-demo.org`
- **Description**: Sample issuer organization for demonstration

### 3. Issuer User
- **Email**: `issuer@certo.com` (same as issuer profile)
- **Password**: `Issuer123!`
- **Role**: Authenticated user
- **Purpose**: Represents the issuer organization user

### 4. Sample Achievement
- **Name**: "Web Development Fundamentals"
- **Description**: Demonstrates proficiency in HTML, CSS, and JavaScript fundamentals
- **Skills**: HTML, CSS, JavaScript
- **Alignment**: Web Development Standards (W3C)
- **Creator**: Issuer profile
- **Tags**: web-development, frontend, programming

### 5. Sample Credential
- **Name**: "Web Development Fundamentals Certificate"
- **Description**: Certificate awarded for completing the Web Development Fundamentals course
- **Issuer**: Issuer profile
- **Recipient**: Same as issuer (for demo purposes)
- **Achievement**: Web Development Fundamentals achievement
- **Validity**: 1 year from creation
- **Proof**: Ed25519Signature2020 cryptographic proof

### 6. API Permissions

#### Public Permissions
- Read access to achievements, profiles, credentials
- Verification and validation endpoints
- Evidence and revocation list access

#### Authenticated User Permissions
- Full CRUD operations on credentials
- Profile management (create, update, read)
- Achievement management (create, update, delete)
- Custom endpoints (me, myIssuedCredentials, myReceivedCredentials)

## Usage Instructions

### Quick Start
```bash
# From project root
./scripts/fresh-install.sh
```

### Manual Execution
```bash
# Start backend
docker-compose up backend -d

# Run fresh install
docker exec -it certo_backend npm run fresh-install
```

### Testing
```bash
# Test the installation
docker exec -it certo_backend npm run test-fresh-install
```

## Security Considerations

### Default Credentials
The script creates default credentials for development/demo purposes:

- **Admin**: `admin@certo.com` / `Admin123!`
- **Issuer**: `issuer@certo.com` / `Issuer123!`

⚠️ **Important**: These credentials should be changed immediately in production environments.

### Environment Variables
The script creates a default `.env` file with development values. In production:

1. Use strong, unique secrets
2. Change all default passwords
3. Enable two-factor authentication
4. Follow security best practices

## License Information

The script includes license information and contribution guidelines as requested in the issue:

- **License**: GNU Affero General Public License v3.0 (AGPL-3.0) — see the root `LICENSE` file
- **Repository**: https://github.com/Schroedinger-Hat/certo
- **Contribution**: Encourages users to contribute back to the repository

## Error Handling

The script includes comprehensive error handling:

- **Idempotent**: Can be run multiple times safely
- **Duplicate Detection**: Skips existing entries
- **Validation**: Checks prerequisites before execution
- **Logging**: Detailed console output for debugging

## Testing

The test script verifies:

1. Admin user exists
2. Issuer profile exists
3. Issuer user exists
4. Sample achievement exists
5. Sample credential exists
6. API permissions are configured
7. Relationships are correct

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify database exists

2. **Permission Errors**
   - Check file permissions
   - Ensure Docker container has write access

3. **Duplicate Entry Errors**
   - Normal behavior (script is idempotent)
   - Existing entries are skipped

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d

# Run fresh install
./scripts/fresh-install.sh
```

## Future Enhancements

Potential improvements for future versions:

1. **Configuration File**: Allow customization via config file
2. **Multiple Environments**: Support for staging/production setups
3. **Backup/Restore**: Include backup functionality
4. **Validation**: More comprehensive data validation
5. **Customization**: Allow custom achievements and credentials

## Compliance with Issue Requirements

The implementation fully addresses the requirements from [Issue #57](https://github.com/Schroedinger-Hat/certo/issues/57):

✅ **Strapi Installation**: Complete setup with environment variables
✅ **Admin User**: Created with proper credentials
✅ **Issuer Profile**: Complete profile with organization details
✅ **Issuer User**: Same email and organization as profile
✅ **Sample Credential**: Created by issuer profile
✅ **API Permissions**: Properly configured for public, issuer, and authenticated users
✅ **License Information**: Included with contribution guidelines

## API Endpoints Available After Installation

- **Profiles**: `GET /api/profiles`
- **Credentials**: `GET /api/credentials`
- **Achievements**: `GET /api/achievements`
- **Verification**: `POST /api/credentials/verify`
- **Admin Panel**: `http://localhost:1337/admin`

## Next Steps for Users

After running the fresh install:

1. **Explore Admin Panel**: Navigate to http://localhost:1337/admin
2. **Test API**: Use tools like Postman to test endpoints
3. **Customize Content**: Add your own achievements and credentials
4. **Set Up Frontend**: Configure the frontend application
5. **Production Setup**: Change default credentials and secrets

## Contributing

If you make changes to this implementation:

1. Follow the existing code style
2. Add appropriate tests
3. Update documentation
4. Submit a pull request to the repository

For more information, see the [main project README](../../README.md) and [scripts documentation](../src/backend/scripts/README.md). 