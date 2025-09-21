# 🐍 Slither.io Clone - Deployment Guide

## Quick Deployment (Recommended)

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Deploy Backend to Railway:
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository and choose the `backend` folder
5. Railway will auto-detect it's a Node.js app
6. Set environment variables:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
7. Your backend will be available at: `https://your-app-name.railway.app`

#### Deploy Frontend to Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project" and select your repository
4. Choose the `frontend` folder as the root directory
5. Set environment variable:
   - `REACT_APP_SERVER_URL=https://your-backend-railway-url.railway.app`
6. Deploy!

### Option 2: Heroku (Both frontend and backend)

#### Backend:
```bash
cd backend
git init
heroku create your-slither-backend
git add .
git commit -m "Deploy backend"
git push heroku main
```

#### Frontend:
```bash
cd frontend
# Update .env.production with your Heroku backend URL
heroku create your-slither-frontend
heroku buildpacks:set mars/create-react-app
git add .
git commit -m "Deploy frontend"
git push heroku main
```

### Option 3: DigitalOcean App Platform

1. Fork/push your code to GitHub
2. Go to DigitalOcean App Platform
3. Create new app from GitHub repo
4. Configure:
   - Backend: Node.js service
   - Frontend: Static site
5. Set environment variables accordingly

## Environment Variables

### Backend (.env):
```
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env.production):
```
REACT_APP_SERVER_URL=https://your-backend-url.com
```

## Performance Optimization

For high player counts, consider:

1. **Redis for game state** (for scaling across multiple servers)
2. **Load balancing** with multiple backend instances
3. **CDN** for frontend assets
4. **Database** for leaderboards and player stats

## Custom Domain

Once deployed:
1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. Add custom domain in Vercel/Railway settings
3. Update CORS settings with new domain

## Monitoring

- Use Railway/Vercel analytics
- Add error tracking (e.g., Sentry)
- Monitor server performance

## Security

- Enable HTTPS (automatic on most platforms)
- Set proper CORS origins
- Rate limiting for API endpoints
- Input validation

Your game will be live and accessible to players worldwide! 🌍