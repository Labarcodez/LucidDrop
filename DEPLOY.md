# Deployment Guide — LucidDrop

## Overview

LucidDrop is deployed using a free-tier stack:
- **Backend:** Render (Web Service)
- **Frontend:** Vercel
- **Database:** MongoDB Atlas (Free Tier)
- **CI/CD:** GitHub Actions

---

## Prerequisites

### Accounts
- [Render](https://render.com)
- [Vercel](https://vercel.com)
- [MongoDB Atlas](https://mongodb.com/atlas)
- [GitHub](https://github.com) (repository owner)

### Tools
- Git
- Node.js 18+
- npm

---

## 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free cluster.
2. Create a database user with read/write access.
3. Whitelist IP `0.0.0.0/0` (or Render's IP range).
4. Copy the connection string (e.g., `mongodb+srv://...`).

---

## 2. Render Setup (Backend)

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Use the following settings:
   - **Name:** luciddrop-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free
5. Add environment variables (see below).
6. Click **Create Web Service**.

### Environment Variables (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `SOLANA_RPC` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `CASINO_PRIVATE_KEY` | Base58 casino wallet secret | `5J...` |
| `CASINO_WALLET_PUBLIC_KEY` | Casino wallet public key | `7xKX...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-here` |
| `FRONTEND_URL` | Allowed frontend origin (CORS + Socket.io) | `https://luciddrop.vercel.app` |
| `NODE_ENV` | Environment | `production` |

> **Note:** Render will automatically deploy on push to the `main` branch.

---

## 3. Vercel Setup (Frontend)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Output Directory:** `build`
5. Add environment variables (see below).
6. Click **Deploy**.

### Environment Variables (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Render backend URL | `https://luciddrop-backend.onrender.com` |
| `REACT_APP_WS_URL` | Socket.io WebSocket URL | `wss://luciddrop-backend.onrender.com` |

> **Note:** Vercel will automatically deploy on push to the `main` branch.

---

## 4. GitHub Secrets (CI/CD)

Add these secrets in your repository:
- **Settings → Secrets and Variables → Actions**

| Secret | Source |
|--------|--------|
| `RENDER_API_KEY` | Render Dashboard → Settings → API Keys |
| `RENDER_SERVICE_ID` | Render Dashboard → Web Service → Service ID |
| `VERCEL_TOKEN` | Vercel Dashboard → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel Dashboard → Team → Settings → Team ID |
| `VERCEL_PROJECT_ID` | Vercel Dashboard → Project → Settings → Project ID |

---

## 5. Automated Deployment

### Push to `main` branch

The CI/CD pipeline automatically:
1. Runs backend tests (Jest)
2. Runs frontend tests (Vitest)
3. Deploys backend to Render
4. Deploys frontend to Vercel

### Manual Deployment

#### Render
```bash
# Trigger via GitHub Actions
gh workflow run ci-cd.yml -f deploy-render=true
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

---

## 6. Monitoring (Free Tier)

### Health Check
- Render health check: `/api/health`
- Use [UptimeRobot](https://uptimerobot.com) (free) to monitor the backend URL.

### Error Tracking
- [Sentry](https://sentry.io) (free tier) for frontend error tracking.

### Logging
- Render provides logs in the dashboard.
- Use [Logtail](https://logtail.com) or [BetterStack](https://betterstack.com) (free tier) for structured logging.

---

## 7. Environment Variables Summary

### Backend (Render)
```
MONGODB_URI=mongodb+srv://...
SOLANA_RPC=https://api.mainnet-beta.solana.com
CASINO_PRIVATE_KEY=<base58-secret>
CASINO_WALLET_PUBLIC_KEY=<public-key>
JWT_SECRET=your-secret-here
FRONTEND_URL=https://luciddrop.vercel.app
NODE_ENV=production
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://luciddrop-backend.onrender.com
REACT_APP_WS_URL=wss://luciddrop-backend.onrender.com
```

---

## 8. Troubleshooting

### Render Deployment Fails
- Check build logs in Render dashboard.
- Verify environment variables are set.
- Ensure `MONGODB_URI` is correct and whitelisted.

### Vercel Deployment Fails
- Check build logs in Vercel dashboard.
- Ensure `REACT_APP_API_URL` is correct.
- Verify build command: `npm install && npm run build`.

### CI/CD Pipeline Fails
- Check GitHub Actions logs.
- Verify secrets are set correctly.
- Ensure tests pass locally first.

---

## 9. URLs

- **Frontend:** `https://luciddrop.vercel.app` (or your custom domain)
- **Backend:** `https://luciddrop-backend.onrender.com`
- **Health Check:** `https://luciddrop-backend.onrender.com/api/health`

---

*Last updated: 2026-07-04*
