# Deploy Backend Changes to Railway

## ✅ What Was Changed

The following backend CORS fixes have been pushed to GitHub:
- Updated `CorsConfig.java` to allow localhost origins
- Fixed `SecurityConfig.java` CORS configuration
- Added configurable CORS via environment variable

## 🚀 Deployment Methods

### Method 1: Automatic Deployment (Recommended)

If Railway is connected to your GitHub repository, it will **automatically deploy** when you push changes.

**Status:** ✅ Code is already pushed to GitHub

**What happens:**
1. Railway detects the new commit
2. Automatically triggers a new build
3. Deploys the updated backend

**To verify:**
1. Go to [Railway Dashboard](https://railway.app)
2. Open your project
3. Check the **Deployments** tab
4. Look for a new deployment triggered by the latest commit

---

### Method 2: Manual Redeploy

If automatic deployment didn't trigger, manually redeploy:

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Sign in to your account

2. **Open Your Project**
   - Select your backend project

3. **Redeploy**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - Or click **"Deploy"** if available

4. **Wait for Build**
   - Build takes 5-10 minutes
   - Watch the logs for progress

---

### Method 3: Using Railway CLI (Optional)

If you want to use the CLI:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Link Project:**
   ```bash
   railway link
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

---

## ⚙️ Verify Environment Variables

Make sure these are set in Railway:

### Required Variables

Go to **Backend Service** → **Variables** tab:

```bash
# Application Profile
SPRING_PROFILES_ACTIVE=staging

# CORS Configuration (IMPORTANT for the fix!)
CORS_ALLOWED_ORIGINS=*

# Database (Railway auto-provides these)
# Verify these exist:
# - PGHOST
# - PGPORT
# - PGUSER
# - PGPASSWORD
# - PGDATABASE

# Security
JWT_SECRET=<your-secret>
JWT_EXPIRATION=3600000

# Storage
STORAGE_PUBLIC_URL=https://your-app-name.up.railway.app/api/files
```

### CORS Configuration

The CORS fix allows:
- `http://localhost:8081` (Expo web)
- `http://localhost:19006` (Expo alternative)
- `http://localhost:3000` (Common dev port)
- All origins via pattern (for React Native mobile apps)

**If you want to restrict CORS in production:**
```bash
CORS_ALLOWED_ORIGINS=https://your-production-domain.com,https://your-app.expo.dev
```

---

## ✅ Verify Deployment

### 1. Check Health Endpoint

Visit: `https://your-app-name.up.railway.app/api/health`

Should return:
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

### 2. Check Logs

1. Go to **Deployments** → Latest deployment
2. Click **"View Logs"**
3. Look for:
   - ✅ "Started BookingApplication"
   - ✅ No CORS errors
   - ✅ Database connected

### 3. Test CORS

From your local development (http://localhost:8081):
- Try making an API request
- Check browser console for CORS errors
- Should see no CORS errors now! ✅

---

## 🔍 Troubleshooting

### Issue: Deployment Not Triggering

**Solution:**
1. Check if Railway is connected to GitHub
   - Go to **Settings** → **GitHub**
   - Verify repository is connected
2. Manually trigger redeploy (Method 2 above)

### Issue: Build Fails

**Check logs for:**
- Maven build errors
- Missing dependencies
- Docker build issues

**Solution:**
- Check `Dockerfile` is correct
- Verify `pom.xml` dependencies
- Check Railway logs for specific errors

### Issue: CORS Still Not Working

**Verify:**
1. `CORS_ALLOWED_ORIGINS=*` is set in Railway variables
2. Backend service restarted after variable change
3. Check backend logs for CORS configuration

**Test:**
```bash
curl -H "Origin: http://localhost:8081" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     https://your-app-name.up.railway.app/api/health
```

Should return CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: *`

### Issue: Database Connection Error

**Solution:**
1. Verify PostgreSQL service is running
2. Check database is connected to backend service
3. Verify database variables are set
4. Check connection string format

---

## 📋 Quick Checklist

- [ ] Code pushed to GitHub ✅ (Already done)
- [ ] Railway project connected to GitHub
- [ ] Environment variables set (especially `CORS_ALLOWED_ORIGINS=*`)
- [ ] Deployment triggered (automatic or manual)
- [ ] Build completed successfully
- [ ] Health endpoint works
- [ ] CORS errors resolved in frontend

---

## 🎯 Next Steps After Deployment

1. **Test Frontend**
   - Run your frontend locally
   - Verify API calls work without CORS errors
   - Test authentication endpoints
   - Test listing upload/update

2. **Monitor Logs**
   - Watch Railway logs for any errors
   - Check for successful API requests

3. **Update Frontend API URL** (if needed)
   - Verify frontend is using correct Railway URL
   - Check `src/config/api.js` or similar

---

## 📞 Need Help?

If deployment fails:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure database is connected
4. Check Railway status: https://status.railway.app

---

**Your backend CORS fixes are ready to deploy! 🚀**














