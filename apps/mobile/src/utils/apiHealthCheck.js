// API Health Check Utility
// Checks if backend API is available and responsive
import { API_CONFIG } from '../config/api';
import { logger } from './logger';

let healthCheckCache = null;
let healthCheckCacheTime = 0;
const HEALTH_CHECK_CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Check if API is available and responsive
 * @param {boolean} forceRefresh - Force refresh even if cached
 * @returns {Promise<{available: boolean, status?: number, message?: string}>}
 */
export const checkApiHealth = async (forceRefresh = false) => {
  try {
    // Use cached result if available and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && healthCheckCache && (now - healthCheckCacheTime) < HEALTH_CHECK_CACHE_DURATION) {
      logger.log('✅ Using cached API health check result');
      return healthCheckCache;
    }

    const baseUrl = API_CONFIG.BASE_URL;
    
    // Try to fetch a simple endpoint (health check or root)
    // Use a short timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Use the dedicated health check endpoint
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      // If we get 200 OK, API is definitely available
      const isAvailable = response.ok;
      
      const result = {
        available: isAvailable,
        status: response.status,
        message: isAvailable 
          ? 'API is available' 
          : `API returned status ${response.status}`,
      };

      // Cache the result
      healthCheckCache = result;
      healthCheckCacheTime = now;

      logger.log('✅ API health check:', result);
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Network error or timeout
      const result = {
        available: false,
        status: 0,
        message: fetchError.name === 'AbortError' 
          ? 'API health check timed out' 
          : 'Cannot connect to API',
      };

      // Cache the result (shorter cache for failures)
      healthCheckCache = result;
      healthCheckCacheTime = now;

      logger.warn('⚠️ API health check failed:', result);
      return result;
    }
  } catch (error) {
    logger.error('❌ Error checking API health:', error);
    return {
      available: false,
      status: 0,
      message: 'Error checking API health',
    };
  }
};

/**
 * Clear health check cache
 */
export const clearHealthCheckCache = () => {
  healthCheckCache = null;
  healthCheckCacheTime = 0;
  logger.log('✅ Cleared API health check cache');
};

