#!/bin/bash

# Fresh Install Script for Certo
# This script sets up a complete Strapi instance with all required components

set -e  # Exit on any error

echo "🚀 Certo Fresh Install Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: docker-compose.yml"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating default .env file..."
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT Secrets (change these in production!)
JWT_SECRET=your-jwt-secret-change-this-in-production
ADMIN_JWT_SECRET=your-admin-jwt-secret-change-this-in-production
APP_KEYS=your-app-keys-change-this-in-production
API_TOKEN_SALT=your-api-token-salt-change-this-in-production

# URLs
FRONTEND_URL=http://localhost:3000
PUBLIC_URL=http://localhost:1337
EOF
    echo "✅ Created default .env file"
fi

echo "📋 Prerequisites check completed"
echo ""

# Start the backend container
echo "🐳 Starting backend container..."
docker-compose up backend -d

# Wait for the backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Check if backend is running
if ! docker ps | grep -q "certo_backend"; then
    echo "❌ Error: Backend container failed to start"
    echo "   Check the logs with: docker-compose logs backend"
    exit 1
fi

echo "✅ Backend container is running"
echo ""

# Run the fresh install script
echo "🔧 Running fresh install script..."
docker exec -it certo_backend npm run fresh-install

echo ""
echo "🎉 Fresh install completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Access the admin panel: http://localhost:1337/admin"
echo "   2. Login with admin@certo.com / Admin123!"
echo "   3. Explore the API at http://localhost:1337/api"
echo "   4. Start the frontend: docker-compose up frontend -d"
echo ""
echo "📝 License Information:"
echo "   This project is licensed under the MIT License."
echo "   If you make any changes, please consider contributing back to this repository."
echo "   Repository: https://github.com/Schroedinger-Hat/certo"
echo ""
echo "⚠️  Security Note:"
echo "   Default passwords are for development only. Change them in production!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 