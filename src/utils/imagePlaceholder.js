/**
 * Image Placeholder Utility
 * 
 * Provides copyright-safe placeholder image URLs for apartments.
 * Uses base64 data URIs as fallback when external services are unavailable.
 * This is App Store review-safe and works on all platforms.
 */

/**
 * Get a placeholder image as base64 data URI
 * Creates a simple colored rectangle with text
 * @param {number} width - Image width (default: 400)
 * @param {number} height - Image height (default: 300)
 * @returns {string} Base64 data URI
 */
const getBase64Placeholder = (width = 400, height = 300) => {
  // Create a simple SVG placeholder as base64
  // Gold background (#FFD700) with dark text
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#FFD700"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#333333" text-anchor="middle" dominant-baseline="middle">Apartment Image</text>
  </svg>`;
  // Convert to base64
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * Get a placeholder image URL for apartment listings
 * Tries external service first, falls back to base64 data URI
 * @param {number} width - Image width (default: 400)
 * @param {number} height - Image height (default: 300)
 * @returns {string} Placeholder image URL or data URI
 */
export const getApartmentPlaceholder = (width = 400, height = 300) => {
  // Use base64 data URI as primary method (more reliable, no external dependency)
  // This works even when external services are down
  return getBase64Placeholder(width, height);
  
  // Fallback to external service (commented out since it's failing)
  // const bgColor = 'FFD700'; // Gold background
  // const textColor = '333333'; // Dark text
  // return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=Apartment+Image`;
};

/**
 * Get placeholder image URL for background
 * @param {number} width - Image width (default: 800)
 * @param {number} height - Image height (default: 600)
 * @returns {string} Placeholder image URL or data URI
 */
export const getBackgroundPlaceholder = (width = 800, height = 600) => {
  // Create a simple SVG placeholder as base64
  // Light gold background (#FFF9E6) with gray text
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#FFF9E6"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#666666" text-anchor="middle" dominant-baseline="middle">Apartify Africa</text>
  </svg>`;
  // Convert to base64
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * Default apartment placeholder URL (standard size)
 */
export const DEFAULT_APARTMENT_IMAGE = getApartmentPlaceholder();

/**
 * Default background placeholder URL (standard size)
 */
export const DEFAULT_BACKGROUND_IMAGE = getBackgroundPlaceholder();

/**
 * Check if an image URL is a placeholder
 * @param {string} imageUrl - Image URL to check
 * @returns {boolean} True if the URL is a placeholder
 */
export const isPlaceholderImage = (imageUrl) => {
  if (!imageUrl) return true;
  // Check if it's a placeholder (base64 data URI, placeholder.com URL, or our old identifier)
  return imageUrl.startsWith('data:image/svg+xml') ||
         imageUrl.includes('via.placeholder.com') ||
         imageUrl.includes('placeholder.com') ||
         imageUrl === '__PLACEHOLDER__';
};

