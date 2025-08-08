# Meta Build - Render Deployment Guide

## Deploy to Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure all files are committed including:
   - `render.yaml` (deployment configuration)
   - `Dockerfile` (containerization)
   - `public/manifest.json` (PWA manifest)
   - `public/sw.js` (service worker)

### Step 2: Deploy on Render
1. Go to [Render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Name**: meta-build-app
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for better performance)

### Step 3: Environment Variables (Optional)
If you need external services, add these in Render dashboard:
- `NODE_ENV`: production
- `PORT`: 10000 (Render will override this automatically)

### Step 4: Database (Optional)
For production database instead of JSON files:
1. Create a PostgreSQL database on Render
2. Add `DATABASE_URL` environment variable
3. Update server to use PostgreSQL instead of JSON storage

## PWA Features Included

### ✅ Service Worker
- Caches app shell for offline access
- Background sync when connection returns
- Push notifications ready (if needed)

### ✅ Web App Manifest
- Installable on mobile devices
- Custom app icons and splash screen
- Standalone app experience

### ✅ Offline Support
- App works without internet connection
- Cached data remains accessible
- Graceful offline page for failed requests

## Production Optimizations

### Performance
- Minified and bundled assets
- Gzip compression enabled
- Static file caching
- Optimized API responses

### Security
- Production environment settings
- Secure headers
- HTTPS enforced by Render

### Monitoring
- Health check endpoint: `/api/auth/user`
- Request logging and performance tracking
- Error handling and reporting

## Post-Deployment

### Testing Your PWA
1. Open your Render app URL on mobile
2. Add to home screen when prompted
3. Test offline functionality:
   - Turn off internet
   - App should still load with cached data
   - Verify offline page appears for new requests

### Updating the App
1. Push changes to GitHub
2. Render automatically rebuilds and deploys
3. Service worker updates cached content

## Local Development vs Production

### Development (Replit)
- Hot reloading with Vite
- JSON file storage in `/data`
- Port 5000
- Development service worker

### Production (Render)
- Optimized build
- Persistent file system
- Port 10000 (managed by Render)
- Production service worker with full caching

Your productivity app is now ready for global deployment with PWA capabilities!