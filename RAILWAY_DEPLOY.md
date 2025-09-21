# 🚂 Railway Deployment Guide

## Quick Railway Deployment Fix

If you're getting the "Script start.sh not found" error, here's how to fix it:

### Method 1: Direct Railway Deployment

1. **Push your code to GitHub first**
   ```bash
   git add .
   git commit -m "Add Railway config files"
   git push origin main
   ```

2. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Configure the Service**
   - Choose your repository
   - Railway should auto-detect it's a Node.js project
   - If it doesn't, manually set:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

4. **Set Environment Variables**
   - Go to your project settings
   - Add these variables:
     - `NODE_ENV=production`
     - `PORT=5001` (Railway will override this)

5. **Deploy**
   - Railway will automatically deploy
   - Your backend will be available at: `https://your-app-name.up.railway.app`

### Method 2: Railway CLI (Alternative)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Deploy from backend folder**
   ```bash
   cd backend
   railway init
   railway up
   ```

### Method 3: Manual Configuration

If Railway still can't detect your app:

1. **Go to Railway Dashboard**
2. **Create New Project** → **Empty Project**
3. **Add Service** → **GitHub Repo**
4. **Manually set in Settings**:
   - **Root Directory**: `/backend` (if deploying from root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `$PORT` (Railway provides this)

### Environment Variables for Railway

Set these in Railway dashboard:

```env
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Expected Railway URL Format

Your backend will be available at:
- `https://[your-service-name]-[random-string].up.railway.app`

### Update Frontend

Once deployed, update your frontend `.env.production`:

```env
REACT_APP_SERVER_URL=https://your-railway-backend-url.up.railway.app
```

## Troubleshooting

### Common Issues:

1. **"Script start.sh not found"**
   - Make sure `package.json` has `"start": "node server.js"`
   - Check that `server.js` exists in the backend folder

2. **Build fails**
   - Ensure `package.json` and `package-lock.json` are committed
   - Check Node.js version compatibility

3. **WebSocket connection issues**
   - Railway supports WebSockets by default
   - Make sure CORS is configured for your frontend URL

4. **Port issues**
   - Use `process.env.PORT` in your server.js
   - Don't hardcode port 5001 in production

### Verification

After deployment, test:

1. **Health check**: Visit `https://your-app.up.railway.app/health`
2. **WebSocket**: Check browser console for connection errors
3. **CORS**: Ensure frontend can connect to backend

## Alternative: Use Render.com

If Railway continues to have issues:

1. Go to [render.com](https://render.com)
2. Create "Web Service"
3. Connect GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

Render has excellent Node.js support and WebSocket compatibility.

---

Your multiplayer game should be live and ready for players worldwide! 🌍