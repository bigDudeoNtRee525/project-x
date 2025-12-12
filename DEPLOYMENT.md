# Deployment Guide

This guide covers deploying the Meeting Task Tool to production using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- A server with at least 2GB RAM
- Domain name (optional but recommended)
- Supabase project (for authentication)

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd meeting-task-tool

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your values (see Configuration section below)
nano .env

# 4. Build and start
make prod-build
make prod-up

# 5. Check status
make status
```

## Configuration

### Required Environment Variables

Create a `.env` file in the project root with these values:

```bash
# ============================================
# Database
# ============================================
POSTGRES_DB=meeting_tasks
POSTGRES_USER=admin
POSTGRES_PASSWORD=<generate-a-strong-password>

# ============================================
# Supabase (Authentication)
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-supabase-jwt-secret

# ============================================
# AI Services (DeepSeek)
# ============================================
DEEPSEEKAUTH=your-deepseek-api-key

# ============================================
# CORS - Frontend URLs allowed to access API
# ============================================
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ============================================
# Frontend Build Variables
# ============================================
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Variables

```bash
# Custom ports (defaults shown)
POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Skip database migrations on startup
SKIP_MIGRATIONS=false
```

## Deployment Commands

Using Make (recommended):

| Command | Description |
|---------|-------------|
| `make prod-build` | Build production Docker images |
| `make prod-up` | Start production containers |
| `make prod-down` | Stop production containers |
| `make prod-logs` | View container logs |
| `make prod-restart` | Restart all containers |
| `make prod-rebuild` | Full rebuild and restart |
| `make status` | Check container status |
| `make clean` | Remove all containers and images |

Using Docker Compose directly:

```bash
# Build
docker compose -f docker-compose.prod.yml build

# Start
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild specific service
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Reverse Proxy (nginx)                      │
│                   (optional, recommended)                    │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐       ┌───────────────────────┐
│   Frontend (Next.js)  │       │   Backend (Express)   │
│       Port 3000       │       │       Port 3001       │
└───────────────────────┘       └───────────┬───────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │  PostgreSQL Database  │
                                │       Port 5432       │
                                └───────────────────────┘
```

## Reverse Proxy Setup (Nginx)

For production, use a reverse proxy with SSL. Example nginx configuration:

```nginx
# /etc/nginx/sites-available/meeting-task-tool

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Get SSL certificates with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

## Database Management

### Run Migrations Manually

```bash
# Enter the backend container
docker compose -f docker-compose.prod.yml exec backend sh

# Run migrations
npx prisma migrate deploy

# Or from host machine
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Access Database

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U admin -d meeting_tasks
```

### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U admin meeting_tasks > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20241212.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U admin -d meeting_tasks
```

## Health Checks

The application includes health check endpoints:

- **Backend**: `GET /api/v1/health`
  ```bash
  curl http://localhost:3001/api/v1/health
  # Response: {"status":"ok","timestamp":"2024-12-12T00:00:00.000Z"}
  ```

- **Frontend**: `GET /`
  ```bash
  curl http://localhost:3000/
  ```

Docker automatically monitors these endpoints and will restart unhealthy containers.

## Troubleshooting

### View Logs

```bash
# All services
make prod-logs

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Common Issues

#### 1. Container keeps restarting

Check logs for the specific container:
```bash
docker compose -f docker-compose.prod.yml logs backend --tail=100
```

#### 2. Database connection failed

Ensure PostgreSQL is healthy:
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

Wait for it to be healthy before backend starts (this is automatic, but may take 30s).

#### 3. Frontend can't reach backend

Check that:
- `NEXT_PUBLIC_API_URL` is correct and accessible
- `ALLOWED_ORIGINS` includes your frontend URL
- Both containers are on the same network

#### 4. Prisma migration errors

```bash
# Reset database (WARNING: destroys data)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset --force

# Or skip migrations on startup and run manually
# Set SKIP_MIGRATIONS=true in .env, then:
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

#### 5. Build fails - out of memory

Increase Docker memory limit or build one service at a time:
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend
```

### Reset Everything

```bash
# Stop and remove everything
make clean

# Remove volumes (WARNING: destroys database)
docker compose -f docker-compose.prod.yml down -v

# Rebuild from scratch
make prod-rebuild
```

## Updating

To deploy updates:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
make prod-rebuild
```

For zero-downtime updates, consider using Docker Swarm or Kubernetes.

## Security Checklist

- [ ] Use strong passwords for `POSTGRES_PASSWORD`
- [ ] Keep `JWT_SECRET` and API keys secure
- [ ] Enable SSL/TLS via reverse proxy
- [ ] Restrict `ALLOWED_ORIGINS` to your domains only
- [ ] Don't expose PostgreSQL port (5432) to the internet
- [ ] Regularly update Docker images
- [ ] Set up automated backups
- [ ] Monitor logs for suspicious activity

## Resource Requirements

Minimum recommended resources:

| Service | CPU | RAM |
|---------|-----|-----|
| PostgreSQL | 0.5 | 256MB |
| Backend | 0.5 | 256MB |
| Frontend | 0.5 | 256MB |
| **Total** | **1.5** | **768MB** |

Recommended for production:

| Service | CPU | RAM |
|---------|-----|-----|
| PostgreSQL | 1 | 512MB |
| Backend | 1 | 512MB |
| Frontend | 1 | 512MB |
| **Total** | **3** | **1.5GB** |

## Support

For issues, check:
1. Container logs: `make prod-logs`
2. Health endpoints: `/api/v1/health`
3. Docker status: `make status`
