// Google OAuth configuration
// Create the credentials at: https://console.cloud.google.com/apis/credentials
//
// Required OAuth clients:
// 1. Android (package: com.nigerianapartments.app, SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25)
//    -> copy its "Client ID" into androidClientId
// 2. iOS (bundle: com.nigerianapartments.app)
//    -> copy its "Client ID" into iosClientId
// 3. Web application (any name)
//    -> copy its "Client ID" into webClientId
//
// Replace every YOUR_* placeholder below with the real Client IDs.

export const GOOGLE_AUTH = {
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID',
};

export const isGoogleConfigured = () =>
  GOOGLE_AUTH.iosClientId !== 'YOUR_IOS_CLIENT_ID' &&
  GOOGLE_AUTH.androidClientId !== 'YOUR_ANDROID_CLIENT_ID' &&
  GOOGLE_AUTH.webClientId !== 'YOUR_WEB_CLIENT_ID';
