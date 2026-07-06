#!/bin/bash

echo "🚀 Deploying LUCID.drop..."

# Backend
echo "📦 Deploying backend..."
cd backend
npm install --production
pm2 restart luciddrop-backend || pm2 start src/index.js --name luciddrop-backend

# Frontend
echo "📦 Deploying frontend..."
cd ../frontend
npm run build

# Upload to Vercel (if using Vercel)
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://luciddrop.com"
echo "🔌 Backend: https://api.luciddrop.com"