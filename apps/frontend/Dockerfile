# Development Dockerfile for frontend
FROM node:20-alpine

WORKDIR /app

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies from root
RUN npm ci

# Copy source code
COPY . .

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Set working directory to frontend
WORKDIR /app/apps/frontend

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "dev"]
