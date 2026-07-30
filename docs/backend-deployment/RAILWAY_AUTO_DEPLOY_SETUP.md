# Railway Auto-Deployment Setup Guide

This guide helps you configure Railway to automatically deploy your backend when code is pushed to GitHub.

## Current Configuration

Your `railway.json` file is configured with:
- **Builder**: DOCKERFILE
- **Root Directory**: `booking-backend`
- **Dockerfile Path**: `Dockerfile` (relative to root directory)
- **Start Command**: `java -jar booking-0.0.1-SNAPSHOT.jar --spring.profiles.active=staging`

## Step-by-Step Setup

### Step 1: Verify Railway Dashboard Settings

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your backend service** (booking-backend)
3. **Go to Settings** (gear icon)

### Step 2: Configure Source/Deploy Settings

In the **Settings** → **Deploy** section, verify/update:

#### Source Configuration
- ✅ **Source**: Should show "Connected to GitHub"
- ✅ **Repository**: Your GitHub repository (e.g., `your-username/Apartments-app`)
- ✅ **Branch**: Set to the branch you're pushing to (usually `main` or `main-clean`)
  - **Important**: Railway watches ONE branch. Make sure you're pushing to the branch Railway is watching.

#### Deploy Configuration
- ✅ **Auto Deploy**: Should be **ENABLED** (toggle ON)
- ✅ **Root Directory**: Set to `booking-backend`
- ✅ **Dockerfile Path**: Set to `Dockerfile` (relative to root directory)
- ✅ **Builder**: Should be `DOCKERFILE` (not NIXPACKS or NODEJS)
- ✅ **Start Command**: `java -jar booking-0.0.1-SNAPSHOT.jar --spring.profiles.active=staging`

### Step 3: Verify GitHub Connection

1. **Check GitHub Integration**:
   - Go to Railway Dashboard → Your Project → Settings
   - Under "Source", verify GitHub is connected
   - If not connected, click "Connect GitHub" and authorize Railway

2. **Verify Webhook**:
   - Railway automatically creates a webhook in your GitHub repository
   - Go to GitHub → Your Repository → Settings → Webhooks
   - You should see a Railway webhook (if not, Railway will create it automatically)

### Step 4: Test Auto-Deployment

1. **Make a small change** to your backend code (e.g., add a comment)
2. **Commit and push** to the branch Railway is watching:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main  # or main-clean, depending on your branch
   ```
3. **Check Railway Dashboard**:
   - Go to **Deployments** tab
   - You should see a new deployment triggered automatically
   - Watch the build logs to verify it's working

### Step 5: Verify Deployment Success

After deployment completes:

1. **Check Deployment Status**:
   - Status should be "Active" (green)
   - Build logs should show "BUILD SUCCESS"

2. **Test API Endpoint**:
   - Visit: `https://booking-backend-staging.up.railway.app/api/apartments`
   - Should return listings (or empty array if no listings exist)

3. **Check Logs**:
   - Go to **Logs** tab in Railway
   - Should see Spring Boot startup messages
   - No errors should be present

## Troubleshooting

### Issue: Auto-deploy not triggering

**Possible Causes & Solutions**:

1. **Wrong Branch**:
   - Railway is watching `main` but you're pushing to `main-clean` (or vice versa)
   - **Solution**: Either change Railway to watch your branch, or push to the branch Railway is watching

2. **Auto Deploy Disabled**:
   - Check Settings → Deploy → Auto Deploy is ON
   - **Solution**: Enable Auto Deploy toggle

3. **GitHub Connection Lost**:
   - Check Settings → Source shows "Not connected"
   - **Solution**: Reconnect GitHub in Railway settings

4. **Webhook Issues**:
   - Railway webhook may not be receiving events
   - **Solution**: Check GitHub → Settings → Webhooks for Railway webhook status

### Issue: Build Fails

**Check Build Logs**:
- Go to Deployments → Latest deployment → View Logs
- Look for error messages

**Common Build Errors**:

1. **"Dockerfile not found"**:
   - **Solution**: Verify Root Directory is set to `booking-backend` in Railway settings

2. **"JAR file not found"**:
   - **Solution**: Check Dockerfile is building correctly
   - Verify Maven build succeeds in logs

3. **"Port already in use"**:
   - **Solution**: Railway handles ports automatically, this shouldn't happen
   - Check if start command is correct

### Issue: Deployment Succeeds but API Doesn't Work

1. **Check Environment Variables**:
   - Go to Variables tab
   - Verify required variables are set (DATABASE_URL, JWT_SECRET, etc.)

2. **Check Application Logs**:
   - Go to Logs tab
   - Look for Spring Boot errors
   - Check database connection errors

3. **Verify Database Connection**:
   - Ensure PostgreSQL service is running in Railway
   - Check DATABASE_URL is set correctly

## Manual Redeploy (If Needed)

If auto-deploy isn't working, you can manually redeploy:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for build to complete (5-10 minutes)

## Railway CLI Alternative

You can also deploy using Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

## Verification Checklist

After setup, verify:

- [ ] Railway is connected to GitHub
- [ ] Auto Deploy is enabled
- [ ] Root Directory is set to `booking-backend`
- [ ] Dockerfile Path is set to `Dockerfile`
- [ ] Builder is set to `DOCKERFILE`
- [ ] Start Command matches railway.json
- [ ] Branch matches the branch you're pushing to
- [ ] Test push triggers automatic deployment
- [ ] Deployment succeeds and API is accessible

## Next Steps

Once auto-deployment is working:

1. **Monitor Deployments**: Check Railway dashboard regularly to ensure deployments succeed
2. **Set Up Alerts**: Configure Railway notifications for failed deployments
3. **Review Logs**: Periodically check application logs for errors
4. **Test After Each Deploy**: Verify API endpoints work after each deployment

## Support

If issues persist:

1. Check Railway Status: https://status.railway.app
2. Review Railway Documentation: https://docs.railway.app
3. Check Railway Community: https://discord.gg/railway

