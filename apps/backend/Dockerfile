# Development Dockerfile for backend
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/

# Install dependencies from root
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "dev"]