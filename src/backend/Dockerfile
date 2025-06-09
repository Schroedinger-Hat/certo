FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci
# Install PostgreSQL client
RUN npm install pg --save

# Copy application files
COPY . .

# Create the basic middlewares file
RUN mkdir -p /app/config && \
    echo "module.exports = ['strapi::errors', 'strapi::cors', 'strapi::poweredBy', 'strapi::logger', 'strapi::query', 'strapi::body', 'strapi::session', 'strapi::favicon', 'strapi::public'];" > /app/config/middlewares.js

# Build the application
RUN npm run build

# Expose the port
EXPOSE 1337

# Start the application
CMD ["npm", "run", "develop"] 