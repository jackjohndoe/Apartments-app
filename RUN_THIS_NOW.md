# 🚀 Run This Command Now!

## Step 1: Open Your Terminal

Make sure you're in the project directory:
```bash
cd "C:\Users\USER\Pictures\stage2\mobile app1 - Copy - Copy"
```

## Step 2: Run EAS Credentials

**Copy and paste this command:**

```bash
eas credentials -p ios
```

This will start the interactive credential setup for iOS.

## Step 3: Follow the Prompts

You'll see prompts like this. Here's what to select:

### Prompt 1: What do you want to do?
```
? What do you want to do? ›
❯ Set up new credentials
  Manage existing credentials
```
**→ Select: "Set up new credentials"** (use arrow keys, press Enter)

### Prompt 2: How to manage credentials?
```
? How would you like to manage your credentials? ›
❯ Let EAS handle credentials (Recommended)
  Set up credentials manually
```
**→ Select: "Let EAS handle credentials (Recommended)"** (press Enter)

### Prompt 3: Apple Developer Account
```
? Do you have an Apple Developer account? ›
❯ Yes
  No
```
**→ Select: "Yes"** (press Enter)

### Prompt 4: Apple ID Email
```
? Enter your Apple ID email: 
```
**→ Type your Apple Developer account email** (the one with the $99/year membership)
**→ Press Enter**

### Prompt 5: Apple ID Password
```
? Enter your Apple ID password: 
```
**→ Type your password** (it won't show on screen - this is normal!)
**→ Press Enter**

### Prompt 6: Two-Factor Authentication (if enabled)
If you have 2FA enabled, you'll see:
```
? Enter the 6-digit code from your trusted device: 
```
**→ Check your iPhone, iPad, or Mac for the 6-digit code**
**→ Type the code**
**→ Press Enter**

### Prompt 7: App-Specific Password (if needed)
If it asks for an app-specific password:
```
? Enter your app-specific password: 
```
**→ If needed, create one at: https://appleid.apple.com**
**→ Go to Security → App-Specific Passwords → Generate**
**→ Use that password**

## Step 4: Wait for Success

EAS will automatically:
- Create distribution certificates
- Generate provisioning profiles
- Store credentials securely

**This takes 1-2 minutes.**

You should see:
```
✅ Successfully set up iOS credentials
```

## If You Get Errors

### Error: "Apple ID authentication failed"
- Make sure you're using the correct Apple ID (the one with Developer account)
- Check if 2FA code is correct
- You may need an app-specific password

### Error: "No Apple Developer account found"
- Verify your Apple ID has active Developer Program membership
- Check at: https://developer.apple.com/account

### Error: "Certificate creation failed"
- EAS will try to handle this automatically
- If it fails, you may need to manually manage certificates

## After Success

Once you see "✅ Successfully set up iOS credentials", let me know and we'll:
1. ✅ Verify everything is working
2. ✅ Start the production build
3. ✅ Continue with App Store submission

---

**Ready? Run this command now:**
```bash
eas credentials -p ios
```

**Then follow the prompts above. Let me know when you're done or if you get stuck!**


