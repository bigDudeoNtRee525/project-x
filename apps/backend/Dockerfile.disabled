# Development Dockerfile for backend
FROM node:20-slim

WORKDIR /app

# Install required system dependencies (OpenSSL, CA certificates, netcat for healthchecks)
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies from root
RUN npm ci

# Copy source code
COPY . .

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start application (push schema to DB and run dev server)
CMD ["sh", "-c", "npx prisma db push && npm run dev"]
