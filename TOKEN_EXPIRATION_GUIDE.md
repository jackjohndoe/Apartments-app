# Token Expiration Guide

## What Happens When Your Token Expires

When your authentication token expires, you'll see a message: **"Your authentication token has expired. Please log in again to obtain a new token."**

## What This Means

- Your session has expired for security reasons
- You can still use the app with local data
- Some features that require backend access may not work
- You need to sign out and sign back in to get a new token

## How to Fix It

### Option 1: Sign Out and Sign Back In (Recommended)

1. Go to **Profile** screen
2. Click **"Sign Out"** button
3. Sign back in with your email and password
4. Your token will be refreshed automatically

### Option 2: Continue Using App (Limited Features)

- You can continue using the app
- Local features will work (viewing cached listings, etc.)
- Backend features won't work (API calls, wallet sync, etc.)
- You'll need to sign out/in eventually to restore full functionality

## Why This Happens

- Tokens expire for security reasons (typically after a period of inactivity)
- The backend refresh endpoint may not be available
- This is a security feature to protect your account

## Technical Details

- Token refresh attempts are limited (max 3 failures)
- After 3 failed refresh attempts, the app stops trying automatically
- You must sign out and sign back in to reset the failure count
- The app gracefully handles expired tokens without logging you out

## Prevention

- Sign out and sign back in periodically
- The app will attempt to refresh tokens automatically when possible
- If refresh fails, you'll be notified to sign out/in

## Support

If you continue to experience issues:
1. Clear your browser cache (web) or app data (mobile)
2. Sign out completely
3. Sign back in
4. If problems persist, contact support







