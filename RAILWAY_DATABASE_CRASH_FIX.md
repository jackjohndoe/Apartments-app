# Fix: Backend Crashing - Database Connection Error

## Problem

Backend is crashing with:
```
Connection to localhost:5432 refused
```

This means the application is trying to connect to `localhost` instead of Railway's database.

## Root Cause

The Railway environment variables (`PGHOST`, `PGPORT`, etc.) are either:
1. Not set in Railway
2. Database service not connected to backend service
3. Staging profile not being used

## Solution

### Step 1: Verify Database Service in Railway

1. Go to **Railway Dashboard** → Your Project
2. Check if you have a **PostgreSQL** service
3. If not, add one:
   - Click **"+ New"**
   - Select **"Database"** → **"Add PostgreSQL"**

### Step 2: Connect Database to Backend Service

**CRITICAL:** The database service must be connected to your backend service.

1. In Railway, go to your **backend service**
2. Check **Settings** → **Variables** tab
3. Look for these variables (Railway should auto-provide them):
   - `PGHOST` - Should NOT be "localhost"
   - `PGPORT` - Usually 5432
   - `PGUSER` - Database username
   - `PGPASSWORD` - Database password
   - `PGDATABASE` - Database name

**If these variables are MISSING:**

1. Go to your **PostgreSQL service** → **Variables** tab
2. Copy the connection details
3. Go to **Backend service** → **Variables** tab
4. Add these variables manually:
   ```bash
   PGHOST=<value from PostgreSQL service>
   PGPORT=<value from PostgreSQL service>
   PGUSER=<value from PostgreSQL service>
   PGPASSWORD=<value from PostgreSQL service>
   PGDATABASE=<value from PostgreSQL service>
   ```

### Step 3: Verify Required Environment Variables

In **Backend Service** → **Variables**, ensure you have:

```bash
# CRITICAL - Must be set!
SPRING_PROFILES_ACTIVE=staging

# Database (Railway auto-provides these when connected)
PGHOST=<should be Railway database host, NOT localhost>
PGPORT=5432
PGUSER=<database username>
PGPASSWORD=<database password>
PGDATABASE=<database name>

# Other required variables
JWT_SECRET=<your-secret>
CORS_ALLOWED_ORIGINS=*
```

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"**
3. Wait for build to complete
4. Check logs - should see successful database connection

## Verification

After redeploy, check logs for:
- ✅ "Started BookingApplication"
- ✅ No "Connection refused" errors
- ✅ "HikariPool - Start completed"
- ✅ Database connection successful

## Alternative: Use DATABASE_URL

If Railway provides `DATABASE_URL` instead of individual variables:

1. Check if `DATABASE_URL` exists in **Backend Service** → **Variables**
2. If it does, the configuration will use it automatically
3. Format should be: `postgresql://user:password@host:port/database`

## Troubleshooting

### Issue: Still Connecting to localhost

**Check:**
1. `SPRING_PROFILES_ACTIVE=staging` is set
2. `PGHOST` is set and NOT "localhost"
3. Database service is running (green status)
4. Database service is connected to backend service

**Solution:**
- Verify all variables are set correctly
- Restart backend service after setting variables
- Redeploy

### Issue: Variables Not Appearing

**Solution:**
1. Disconnect and reconnect database service
2. Or manually add variables from database service
3. Restart backend service

### Issue: Connection Still Fails After Fix

**Check:**
1. Database service is running
2. Variables are correct (no typos)
3. SSL mode is correct (Railway uses SSL)
4. Network connectivity between services

## Quick Checklist

- [ ] PostgreSQL database service exists
- [ ] Database service is connected to backend service
- [ ] `SPRING_PROFILES_ACTIVE=staging` is set
- [ ] `PGHOST` is set (NOT localhost)
- [ ] `PGPORT` is set
- [ ] `PGUSER` is set
- [ ] `PGPASSWORD` is set
- [ ] `PGDATABASE` is set
- [ ] Backend service redeployed
- [ ] Logs show successful connection

---

**After fixing, the backend should connect to Railway's database instead of localhost!** ✅

