// Mailjet Configuration
// Mailjet API for sending emails directly from the mobile app
// Supports environment variables with fallback to hardcoded values

export const MAILJET_CONFIG = {
  // Mailjet API Key
  // Can be set via MAILJET_API_KEY environment variable or hardcoded here
  API_KEY: process.env.MAILJET_API_KEY || '32d750bffa1b4a2cc8699fe19f8ef0a5',
  
  // Mailjet API Secret
  // Can be set via MAILJET_API_SECRET environment variable or hardcoded here
  API_SECRET: process.env.MAILJET_API_SECRET || 'd298c4f9295715e76904c4881142e471',
  
  // Mailjet API endpoint (REST API v3.1)
  API_URL: 'https://api.mailjet.com/v3.1/send',
  
  // Sender email address (MUST be verified in Mailjet Dashboard)
  // Can be set via MAILJET_FROM_EMAIL environment variable or hardcoded here
  FROM_EMAIL: process.env.MAILJET_FROM_EMAIL || 'nigerianapartments@apartifyafrica.site',
  FROM_NAME: process.env.MAILJET_FROM_NAME || 'Nigerian Apartments',
};

// Check if Mailjet is configured
export const isMailjetConfigured = () => {
  const hasApiKey = MAILJET_CONFIG.API_KEY && MAILJET_CONFIG.API_KEY !== 'YOUR_MAILJET_API_KEY';
  const hasApiSecret = MAILJET_CONFIG.API_SECRET && MAILJET_CONFIG.API_SECRET !== 'YOUR_MAILJET_API_SECRET';
  const hasFromEmail = MAILJET_CONFIG.FROM_EMAIL && MAILJET_CONFIG.FROM_EMAIL !== 'YOUR_EMAIL@example.com';
  
  if (hasApiKey && !hasApiSecret) {
    console.warn('⚠️ Mailjet API key is set, but API secret is missing');
  }
  
  if ((hasApiKey && hasApiSecret) && !hasFromEmail) {
    console.warn('⚠️ Mailjet API credentials are set, but FROM_EMAIL needs to be updated to your verified sender email in Mailjet Dashboard');
  }
  
  return hasApiKey && hasApiSecret && hasFromEmail;
};

// Legacy aliases for backward compatibility
export const SENDGRID_CONFIG = MAILJET_CONFIG;
export const isSendGridConfigured = isMailjetConfigured;
