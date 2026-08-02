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

# Build the application
RUN npm run build

# Expose the port
EXPOSE 1337

# Start the application in production mode
CMD ["npm", "run", "start"] 