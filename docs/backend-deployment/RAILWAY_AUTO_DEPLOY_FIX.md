# Fix Railway Auto-Deployment

Your backend changes are pushed to GitHub, but Railway isn't automatically deploying. Here's how to fix it:

## Quick Fix: Manual Redeploy (Immediate)

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your backend service** (booking-backend)
3. **Go to "Deployments" tab**
4. **Click "Redeploy"** on the latest deployment
5. Wait for build to complete (5-10 minutes)

This will immediately deploy your latest changes from GitHub.

---

## Fix Auto-Deployment (Permanent)

### Step 1: Check GitHub Connection

1. **Go to Railway Dashboard** → Your Project
2. **Click "Settings"** (gear icon)
3. **Check "Source" section**:
   - Should show: "Connected to GitHub"
   - Repository: `jackjohndoe/Apartments-app` (or your repo)
   - Branch: Check which branch is selected

### Step 2: Check Branch Configuration

**Problem**: Railway might be watching `main` branch, but you pushed to `main-clean`

**Solution A: Change Railway to watch `main-clean` branch**

1. **Service Settings** → **Source**
2. **Change branch** from `main` to `main-clean`
3. **Save**
4. Railway will automatically deploy from `main-clean` now

**Solution B: Merge `main-clean` into `main`**

If you want Railway to watch `main` branch:

```bash
# Switch to main branch
git checkout main

# Merge main-clean into main
git merge main-clean

# Push to main
git push origin main
```

Then Railway will auto-deploy from `main`.

### Step 3: Enable Auto-Deploy

1. **Service Settings** → **Deploy**
2. **Enable "Auto Deploy"** (should be ON)
3. **Save**

### Step 4: Verify Auto-Deploy Settings

**Service Settings** → **Deploy** should show:
- ✅ **Auto Deploy**: Enabled
- ✅ **Branch**: `main-clean` (or `main` if you merged)
- ✅ **Source**: Connected to GitHub

---

## Alternative: Trigger Deployment via Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

---

## Verify Deployment

After redeploying, check:

1. **Deployments Tab**: Should show new deployment in progress
2. **Logs**: Click on deployment → "View Logs"
   - Should see: "Building..." → "Deploying..." → "Running"
3. **Health Check**: Visit `https://booking-backend-staging.up.railway.app/api/health`
   - Should return: `{"status":"UP"}`

---

## Common Issues

### Issue 1: Railway watching wrong branch

**Symptom**: Changes pushed but no deployment triggered

**Fix**: 
- Check which branch Railway is watching (Settings → Source)
- Either change Railway to watch your branch, or merge your branch into the watched branch

### Issue 2: Auto-deploy disabled

**Symptom**: Manual redeploy works, but auto-deploy doesn't

**Fix**:
- Service Settings → Deploy → Enable "Auto Deploy"

### Issue 3: GitHub connection lost

**Symptom**: Source shows "Not connected"

**Fix**:
1. Service Settings → Source
2. Click "Connect GitHub"
3. Authorize Railway
4. Select repository and branch
5. Save

### Issue 4: Build fails

**Symptom**: Deployment starts but fails during build

**Fix**:
- Check build logs for errors
- Verify `railway.json` and `Dockerfile` are correct
- Ensure all dependencies are in `pom.xml`

---

## Recommended Setup

For your project, I recommend:

1. **Branch**: Use `main-clean` as your main branch
2. **Railway Settings**:
   - Source: Connected to `jackjohndoe/Apartments-app`
   - Branch: `main-clean`
   - Auto Deploy: Enabled
3. **Workflow**:
   - Make changes locally
   - Commit and push to `main-clean`
   - Railway automatically deploys

---

## Quick Commands

```bash
# Check current branch
git branch

# Push to main-clean (if Railway is watching this)
git push origin main-clean

# Or merge and push to main (if Railway is watching main)
git checkout main
git merge main-clean
git push origin main
```

---

## Next Steps

1. ✅ **Immediate**: Manually redeploy in Railway dashboard
2. ✅ **Permanent**: Configure Railway to watch `main-clean` branch
3. ✅ **Verify**: Check health endpoint after deployment
4. ✅ **Test**: Test API endpoints to ensure JWT fix works

Your backend should now deploy automatically whenever you push to the watched branch! 🚀














