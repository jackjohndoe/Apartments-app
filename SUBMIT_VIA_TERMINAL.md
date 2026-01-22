# Submit Build to App Store via Terminal

## Method 1: Submit Latest Build (Recommended)

Submit the most recent iOS build:

```bash
eas submit --platform ios --latest
```

This will:
- Find the latest iOS production build (build 1.0.0 (22))
- Prompt for Apple ID credentials
- Upload and submit to App Store Connect

## Method 2: Submit Specific Build by ID

Submit build 1.0.0 (22) specifically:

```bash
eas submit --platform ios --id ruifvsm1ns
```

Build ID: `ruifvsm1ns` (from build 1.0.0 (22))

## Method 3: Submit with Profile

Use the production profile from eas.json:

```bash
eas submit --platform ios --latest --profile production
```

## What You'll Need

When you run the command, you'll be prompted for:

1. **Apple ID** - Your Apple Developer account email
2. **Password** - Your Apple ID password
3. **2FA Code** - If two-factor authentication is enabled (you'll receive it on your trusted device)

## Non-Interactive Mode

If you want to avoid prompts (requires credentials to be configured):

```bash
eas submit --platform ios --latest --non-interactive
```

**Note**: This requires Apple credentials to be pre-configured in EAS.

## Additional Options

### Wait for Submission to Complete

```bash
eas submit --platform ios --latest --wait
```

### Verbose Logging

```bash
eas submit --platform ios --latest --verbose
```

### Add to TestFlight Groups

```bash
eas submit --platform ios --latest --groups "Internal Testing"
```

## Troubleshooting

### Error: "Set ascAppId in the submit profile"
- This means the App Store Connect App ID isn't configured
- Run the command interactively (without `--non-interactive`) to configure it
- Or add `ascAppId` to your `eas.json` submit profile

### Error: "Credentials required"
- You need to provide Apple ID credentials interactively
- Or configure them in EAS credentials

### Build Not Found
- Make sure the build is finished (status: "Finished")
- Check build ID is correct
- Use `--latest` to automatically find the latest build

## Current Build Details

- **Build Number**: 1.0.0 (22)
- **Build ID**: ruifvsm1ns
- **Status**: Finished ✅
- **Platform**: iOS
- **Profile**: production

## Quick Command

```bash
eas submit --platform ios --latest --wait
```

This will:
1. Find latest iOS build
2. Prompt for Apple credentials
3. Submit to App Store Connect
4. Wait for submission to complete









