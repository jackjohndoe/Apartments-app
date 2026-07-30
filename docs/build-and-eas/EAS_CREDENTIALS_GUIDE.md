# EAS Credentials Setup Guide - Step by Step

## What We're Doing

Setting up iOS credentials so EAS can build and sign your app for the App Store.

## Step-by-Step Instructions

### 1. Open Terminal

You're already in the right directory: `c:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy`

### 2. Run the Command

Type this command and press Enter:

```bash
eas credentials
```

### 3. Follow the Prompts

**Prompt 1: Select Platform**
```
? Select platform ›
❯ iOS
  Android
```
- Use arrow keys to select **iOS**
- Press Enter

**Prompt 2: What do you want to do?**
```
? What do you want to do? ›
❯ Set up new credentials
  Manage existing credentials
  Remove credentials
```
- Select **Set up new credentials** (or "Manage existing" if you've done this before)
- Press Enter

**Prompt 3: How would you like to manage your credentials?**
```
? How would you like to manage your credentials? ›
❯ Let EAS handle credentials (Recommended)
  Set up credentials manually
```
- Select **Let EAS handle credentials (Recommended)**
- Press Enter

**Prompt 4: Apple Developer Account**
```
? Do you have an Apple Developer account? ›
❯ Yes
  No
```
- Select **Yes**
- Press Enter

**Prompt 5: Apple ID**
```
? Enter your Apple ID email: 
```
- Type your Apple Developer account email
- Press Enter

**Prompt 6: Apple ID Password**
```
? Enter your Apple ID password: 
```
- Type your password (it won't show on screen - this is normal)
- Press Enter

**Prompt 7: Two-Factor Authentication (if enabled)**
```
? Enter the 6-digit code from your trusted device: 
```
- Check your iPhone, iPad, or Mac for the 6-digit code
- Type the code
- Press Enter

**Prompt 8: App-Specific Password (if required)**
If you see this prompt:
```
? Enter your app-specific password: 
```
- You may need to create an app-specific password at https://appleid.apple.com
- Or use your regular password if 2FA code worked

### 4. What Happens Next

EAS will automatically:
- ✅ Create distribution certificates
- ✅ Generate provisioning profiles
- ✅ Store credentials securely
- ✅ Set everything up for App Store builds

**This takes 1-2 minutes.**

### 5. Success Message

You should see:
```
✅ Successfully set up iOS credentials
```

---

## Troubleshooting

### Issue: "Apple ID authentication failed"

**Solution:**
1. Make sure you're using the correct Apple ID (the one with Apple Developer account)
2. If you have 2FA enabled, you'll need the code from your device
3. You may need to create an app-specific password:
   - Go to https://appleid.apple.com
   - Sign in → Security → App-Specific Passwords
   - Generate a new password
   - Use that password instead

### Issue: "No Apple Developer account found"

**Solution:**
- Make sure your Apple ID has an active Apple Developer Program membership ($99/year)
- Check at https://developer.apple.com/account
- If you don't have one, you'll need to enroll first

### Issue: "Certificate creation failed"

**Solution:**
- Make sure you have available certificate slots (Apple allows 3 distribution certificates)
- EAS will try to revoke old certificates if needed
- If it fails, you may need to manually manage certificates in Apple Developer portal

### Issue: Command hangs or freezes

**Solution:**
- Press Ctrl+C to cancel
- Try again: `eas credentials`
- Make sure you have internet connection
- Check if Apple Developer portal is accessible

---

## Alternative: Manual Credential Setup

If automatic setup doesn't work, you can set up manually:

1. Run: `eas credentials`
2. Select: **Set up credentials manually**
3. Follow the manual instructions
4. You'll need to:
   - Create certificates in Apple Developer portal
   - Download and provide them to EAS

---

## After Credentials Are Set Up

Once you see the success message, let me know and we'll:
1. ✅ Verify credentials are working
2. ✅ Start the production build
3. ✅ Continue with App Store submission

---

## Quick Reference

**Command to run:**
```bash
eas credentials
```

**What to select:**
- Platform: iOS
- Action: Set up new credentials
- Method: Let EAS handle credentials
- Apple ID: Your developer account email
- Password: Your Apple ID password
- 2FA Code: From your trusted device

**Expected time:** 2-3 minutes

---

**Ready? Run `eas credentials` now and follow the prompts. Let me know if you get stuck at any step!**


