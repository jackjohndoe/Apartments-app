# Railway Database Connection Fix

## Problem

The backend is trying to connect to `localhost:5432` instead of Railway's database, causing:
```
Connection to localhost:5432 refused
```

## Root Cause

Railway provides database connection variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`), but they might not be set or the database service isn't connected to the backend service.

## Solution

### Step 1: Verify Database Service is Connected

1. Go to **Railway Dashboard** → Your Project
2. Check if you have a **PostgreSQL** service
3. If not, add one:
   - Click **"+ New"**
   - Select **"Database"** → **"Add PostgreSQL"**

### Step 2: Connect Database to Backend Service

1. In your **backend service**, go to **Settings** → **Variables**
2. Railway should automatically provide these variables when database is connected:
   - `PGHOST` - Database host
   - `PGPORT` - Database port (usually 5432)
   - `PGUSER` - Database username
   - `PGPASSWORD` - Database password
   - `PGDATABASE` - Database name

**If these variables are NOT present:**

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

### Step 3: Verify Environment Variables

In **Backend Service** → **Variables**, ensure you have:

```bash
# Application Profile (IMPORTANT!)
SPRING_PROFILES_ACTIVE=staging

# Database (Railway auto-provides these when connected)
PGHOST=<should be set automatically>
PGPORT=<should be set automatically>
PGUSER=<should be set automatically>
PGPASSWORD=<should be set automatically>
PGDATABASE=<should be set automatically>

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
- ✅ No database connection errors
- ✅ "HikariPool - Start completed"

## Alternative: Use DATABASE_URL

If Railway provides `DATABASE_URL` instead of individual variables:

1. In **Backend Service** → **Variables**, check if `DATABASE_URL` exists
2. If it does, you may need to convert it to JDBC format
3. Format: `postgresql://user:pass@host:port/dbname` → `jdbc:postgresql://host:port/dbname`

However, the current configuration uses individual variables which is more reliable.

## Troubleshooting

### Issue: Variables Still Not Appearing

**Solution:**
1. Make sure database service is in the same Railway project
2. In database service → **Settings** → Check if it's connected to backend
3. Try disconnecting and reconnecting the database service
4. Restart the backend service

### Issue: Connection Still Fails

**Check:**
1. Database service is running (green status)
2. Variables are set correctly
3. No typos in variable names (case-sensitive)
4. `SPRING_PROFILES_ACTIVE=staging` is set

### Issue: Wrong Database URL Format

**Solution:**
The configuration now uses:
```
jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require
```

This should work with Railway's provided variables.

## Quick Checklist

- [ ] PostgreSQL database service exists in Railway
- [ ] Database service is connected to backend service
- [ ] `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` are set
- [ ] `SPRING_PROFILES_ACTIVE=staging` is set
- [ ] Backend service redeployed
- [ ] Logs show successful database connection

---

**After fixing, redeploy and the database connection should work!** ✅

