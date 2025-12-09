# Development Dockerfile for frontend
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies from root
RUN npm ci

# Copy source code
COPY . .

# Set working directory to frontend
WORKDIR /app/apps/frontend

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "dev"]
