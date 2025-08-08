# Deployment Guide for Meta Build

## Render Deployment Instructions

### Step 1: Build & Deploy Setup

1. **Connect your repository to Render**
   - Go to [render.com](https://render.com)
   - Click "New Web Service"
   - Connect your GitHub repository

2. **Configure the service using the render.yaml file**
   - Render will automatically detect the `render.yaml` configuration
   - Or manually set:
     - **Build Command**: `npm ci && npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `NODE_ENV=production`
       - `PORT=10000`

### Step 2: Environment Variables

Set these environment variables in Render:

```
NODE_ENV=production
PORT=10000
```

### Step 3: Build Process

The build process does the following:
1. `npm ci` - Install dependencies
2. `npm run build` - Build frontend and backend
   - Builds React app to `dist/public/`
   - Builds server to `dist/index.js`
3. `npm start` - Runs `NODE_ENV=production node dist/index.js`

### Step 4: Verify Deployment

After deployment, check:
- ✅ Your app loads at the Render URL
- ✅ Static assets (CSS, JS) load correctly
- ✅ PWA manifest and icons are accessible
- ✅ API endpoints work (check browser network tab)

## Troubleshooting Common Issues

### 1. "Failed to load module script" MIME Type Error
**Fixed**: Server now properly serves static files from `dist/public/`

### 2. Missing Manifest/Icon Errors  
**Fixed**: Added all required PWA assets:
- `/manifest.json`
- `/icons/icon-192x192.svg`
- `/icons/icon-512x512.svg`
- `/sw.js` (service worker)
- `/offline.html`

### 3. 404 Errors for Routes
**Fixed**: SPA fallback correctly serves `index.html` for all non-API routes

## Files Structure After Build

```
dist/
├── index.js                    # Production server
├── public/                     # Static files served by Express
│   ├── index.html             # React app entry point
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── offline.html           # Offline page
│   ├── assets/                # Vite-generated assets
│   │   ├── index-[hash].js    # React app bundle
│   │   └── index-[hash].css   # Styles
│   └── icons/                 # App icons
│       ├── icon-192x192.svg
│       └── icon-512x512.svg
```

## Deployment Commands

```bash
# Local build test
npm run build
NODE_ENV=production node dist/index.js

# Deploy to Render
git push origin main  # Triggers automatic deployment
```

Your app should now work correctly on Render! 🚀