# Railway Deployment Guide

This guide documents how to deploy the Meeting Task Tool monorepo on Railway.

## Services Required

1. **PostgreSQL** - Database
2. **Backend** - Express.js API server
3. **Frontend** - Next.js application

---

## 1. PostgreSQL Setup

1. In Railway, click **New** → **Database** → **PostgreSQL**
2. Once created, copy the `DATABASE_URL` from the **Variables** tab (use the internal URL if backend is also on Railway)

---

## 2. Backend Deployment

### Source Configuration
- **Source**: Connect to your GitHub repository
- **Root Directory**: Leave empty (monorepo root)
- **Watch Paths**: `apps/backend/**`

### Build Configuration
- **Builder**: Nixpacks (or Railpack)
- **Build Command**:
  ```
  npm install && npx prisma generate --schema=apps/backend/prisma/schema.prisma && npm run build --workspace=backend
  ```

### Deploy Configuration
- **Pre-deploy Command**:
  ```
  npx prisma db push --schema=apps/backend/prisma/schema.prisma
  ```
- **Start Command**:
  ```
  node apps/backend/dist/server.js
  ```

### Networking
- **Port**: 8080 (Railway default for Node.js)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:xxx@xxx.railway.internal:5432/railway` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `JWT_SECRET` | Supabase JWT secret (from Supabase dashboard → Settings → API) | `your-jwt-secret` |
| `DEEPSEEKAUTH` | DeepSeek API key for AI features | `sk-...` |
| `ALLOWED_ORIGINS` | Frontend URL(s) for CORS | `https://frontend-production-xxx.up.railway.app` |
| `NODE_ENV` | Environment | `production` |

**Important Notes:**
- `ALLOWED_ORIGINS` must include `https://` prefix
- Use Railway's **internal** DATABASE_URL (ends with `.railway.internal`) for faster connections
- Do NOT set `PORT` manually - Railway sets it automatically

---

## 3. Frontend Deployment

### Source Configuration
- **Source**: Connect to your GitHub repository
- **Root Directory**: `apps/frontend`
- **Watch Paths**: `apps/frontend/**`

### Build Configuration
- **Builder**: Nixpacks (or Railpack)
- Build and start commands should auto-detect from package.json

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backend-production-xxx.up.railway.app/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |

**Important Notes:**
- `NEXT_PUBLIC_API_URL` must point to the **backend** Railway URL, not frontend
- Include `/api/v1` at the end of the API URL

---

## 4. Post-Deployment Checklist

- [ ] PostgreSQL service is healthy
- [ ] Backend service is healthy (check `/api/v1/health` endpoint)
- [ ] Frontend loads without errors
- [ ] CORS is working (no CORS errors in browser console)
- [ ] Authentication works (can login/register)
- [ ] API calls succeed (tasks, contacts, etc. load)

---

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` is set on backend with `https://` prefix
- Ensure `NODE_ENV=production` is set on backend
- Check backend logs for "CORS allowed origins:" to verify

### "Application failed to respond"
- Check if `PORT` is manually set - remove it, let Railway auto-assign
- Check backend runtime logs for errors

### "Table does not exist" errors
- Pre-deploy command didn't run - check it's set correctly
- Verify `DATABASE_URL` is correct and PostgreSQL is accessible

### Prisma schema not found
- Ensure schema path is correct: `--schema=apps/backend/prisma/schema.prisma`
- Check that `prisma` config is in root `package.json`:
  ```json
  "prisma": {
    "schema": "apps/backend/prisma/schema.prisma"
  }
  ```

### Rate limiting errors (X-Forwarded-For)
- Backend needs `app.set('trust proxy', 1)` for Railway's load balancer
- This is already configured in `server.ts`

---

## Key Files Modified for Railway

- `apps/backend/src/server.ts` - Added `trust proxy`, CORS config
- `apps/backend/package.json` - Added prisma schema path
- `package.json` (root) - Added prisma schema path
- `.node-version` - Set to `20` for Railway

---

## Useful Commands

**Check backend health:**
```
curl https://your-backend.up.railway.app/api/v1/health
```

**View logs:**
Railway Dashboard → Select Service → Logs tab

**Redeploy:**
Push to git (auto-deploys) or Railway Dashboard → Deployments → Redeploy
