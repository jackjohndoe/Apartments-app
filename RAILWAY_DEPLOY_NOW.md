# 🚀 Deploy to Railway - Quick Steps

## Current Status
✅ Backend CORS fixes pushed to GitHub
✅ Code is ready to deploy

## Quick Deployment Steps

### Option 1: Automatic (If GitHub Connected)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Sign in

2. **Check Deployments**
   - Open your project
   - Go to **Deployments** tab
   - Look for new deployment (should auto-trigger)

3. **If No Auto-Deploy:**
   - Click **"Redeploy"** on latest deployment
   - Wait 5-10 minutes

---

### Option 2: Manual Redeploy

1. **Railway Dashboard** → Your Project
2. **Deployments** tab
3. Click **"Redeploy"** or **"Deploy"**
4. Wait for build to complete

---

## ⚙️ Verify Environment Variables

**Backend Service** → **Variables** → Check:

```bash
CORS_ALLOWED_ORIGINS=*
SPRING_PROFILES_ACTIVE=staging
JWT_SECRET=<your-secret>
```

---

## ✅ Test After Deployment

1. **Health Check:**
   ```
   https://your-app-name.up.railway.app/api/health
   ```

2. **Test CORS:**
   - Run frontend locally
   - Check browser console
   - Should see no CORS errors ✅

---

## 🆘 If Issues

- Check Railway logs
- Verify environment variables
- Ensure database is connected
- Redeploy if needed

---

**Ready to deploy! Go to Railway dashboard and redeploy.** 🚀














