# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo using npm workspaces with the following structure:
- `apps/frontend`: Next.js 16 application with React 19, Tailwind CSS, and shadcn/ui components
- `apps/backend`: Express.js server with TypeScript, Prisma ORM, and Supabase authentication
- `packages/shared`: Shared TypeScript types used by both frontend and backend

The application is a meeting task tool that extracts action items from meeting transcripts using AI, allowing users to review, assign, and track tasks.

## Development Commands

All commands should be run from the repository root (`meeting-task-tool/`).

### Root Package Scripts
```bash
npm run dev          # Start both frontend and backend in development mode
npm run dev:backend  # Start only backend development server
npm run dev:frontend # Start only frontend development server
npm run build        # Build all workspaces (frontend and backend)
npm run test         # Run tests across all workspaces (currently no tests configured)
npm run lint         # Run linter across all workspaces (currently no linter configured)
npm run db:generate  # Generate Prisma client from schema
npm run db:migrate   # Run Prisma migrations
```

### Backend-specific Commands (run from `apps/backend` or using `--workspace=backend`)
```bash
npm run dev          # Start backend with tsx watch mode
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start compiled server
npm run db:push      # Push schema changes to database (development)
npm run db:studio    # Open Prisma Studio for database management
```

### Frontend-specific Commands (run from `apps/frontend` or using `--workspace=frontend`)
```bash
npm run dev          # Start Next.js development server
npm run build        # Build Next.js application
npm run start        # Start production server
```

### Database Management
- Prisma is used as the ORM with PostgreSQL
- Schema file: `apps/backend/prisma/schema.prisma`
- After schema changes, run `npm run db:generate` then `npm run db:migrate`
- Use `npm run db:studio` to inspect database contents

## Architecture

### Frontend (Next.js App Router)
- **Authentication**: Supabase Auth with JWT tokens, auto-injected via axios interceptors
- **State Management**: Zustand stores (`apps/frontend/stores/`)
- **UI Components**: shadcn/ui with Radix primitives, located in `apps/frontend/components/ui/`
- **API Communication**: Axios instance in `apps/frontend/lib/api.ts` with request/response interceptors
- **Routing**: Next.js App Router with route groups:
  - `(auth)/` - authentication pages (login, register)
  - `(dashboard)/` - main application pages
- **Styling**: Tailwind CSS with `tw-animate-css` for animations

### Backend (Express.js)
- **Server Entry**: `apps/backend/src/server.ts` sets up middleware and routes
- **Route Structure**: Modular routes in `apps/backend/src/routes/` (auth, meetings, tasks, contacts)
- **Authentication**: JWT verification using Supabase JWT secret, middleware in `apps/backend/src/middleware/auth.ts`
- **Database**: Prisma client with PostgreSQL, initialized in `apps/backend/src/lib/prisma.ts`
- **Error Handling**: Global error middleware with `express-async-errors`
- **Security**: Helmet.js, CORS configured for localhost:3000 in development

### Shared Types
- Location: `packages/shared/src/index.ts`
- Contains all shared TypeScript interfaces:
  - API response format (`ApiResponse<T>`)
  - Domain models (User, Meeting, Task, Contact)
  - Request/response types for API endpoints
  - Gantt chart task format for Frappe Gantt integration

### API Communication Pattern
1. Frontend uses `api` axios instance from `lib/api.ts` which automatically adds Supabase JWT token
2. Backend verifies JWT using Supabase secret in auth middleware
3. All API responses follow the `ApiResponse<T>` interface from shared types
4. Backend routes are prefixed with `/api/v1`

### Authentication Flow
1. User signs in via Supabase Auth on frontend
2. Supabase returns JWT token stored in localStorage
3. Axios interceptor adds `Authorization: Bearer <token>` to all requests
4. Backend auth middleware verifies token using Supabase JWT secret
5. User ID extracted from token and attached to `req.userId` for route handlers

### Database Models
Key relations:
- `User` ↔ `Meeting` (one-to-many)
- `User` ↔ `Task` (one-to-many)
- `Meeting` ↔ `Task` (one-to-many)
- `User` ↔ `Contact` (one-to-many)
- `Contact` ↔ `Task` (one-to-many via assignee)

## Environment Variables

Required environment files (see `apps/backend/.env.example`):

### Backend (`.env` in `apps/backend/`)
```
DATABASE_URL="postgresql://user:password@localhost:5432/meeting_tasks"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-jwt-secret"  # Supabase JWT secret
OPENAI_API_KEY="sk-..."       # For AI task extraction
N8N_WEBHOOK_URL="http://localhost:5678/webhook/process-meeting"
PORT=3001
NODE_ENV="development"
```

### Frontend (`.env.local` in `apps/frontend/`)
```
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

## Development Workflow

1. **Setup**: Clone repo, run `npm install` in root, set up environment variables
2. **Database**: Ensure PostgreSQL is running, run `npm run db:migrate` to set up schema
3. **Development**: Run `npm run dev` from root to start both frontend (localhost:3000) and backend (localhost:3001)
4. **Code Changes**:
   - Frontend changes hot-reload via Next.js
   - Backend changes restart via tsx watch mode
5. **Testing**: No test framework currently configured

## Key Files and Directories

- `apps/frontend/app/` - Next.js app router pages and layouts
- `apps/frontend/stores/` - Zustand state stores
- `apps/frontend/lib/` - Utility functions (api, supabase, utils)
- `apps/backend/src/routes/` - Express route handlers
- `apps/backend/src/lib/` - Shared backend utilities (prisma, supabase)
- `packages/shared/src/` - Shared TypeScript types

## Docker Development

Docker Compose configuration is provided for full local development environment:

- **PostgreSQL**: Database container with health checks
- **n8n**: Workflow automation tool for AI task extraction
- **Backend**: Express server with volume mounts for live code reload
- **Frontend**: Next.js application with volume mounts for live reload

To start all services:
```bash
docker-compose up
```

Notes:
- Database runs on host port 5432, backend on 3001, frontend on 3000, n8n on 5678
- Backend and frontend use bind mounts for live code changes
- Environment variables for Docker services are set in docker-compose.yml
- For production, you would need to build custom images with appropriate environment variables

## Notes

- The backend uses Supabase for JWT verification but not for database operations (uses Prisma with PostgreSQL)
- AI task extraction is configured to call an n8n webhook (`N8N_WEBHOOK_URL`)
- Frappe Gantt library is included for timeline visualization of tasks
- No test suite or linting configuration is currently set up