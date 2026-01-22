// Logger utility - Only logs in development mode
// This prevents console logs from appearing in production builds
// which can cause App Store rejection or performance issues

const isDev = __DEV__;

/**
 * Logger utility for development and production
 * - In development: Logs everything for debugging
 * - In production: Only logs errors (critical issues)
 */
export const logger = {
  /**
   * Log informational messages (development only)
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logged, even in production)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log warning messages (development only)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (development only)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log info messages with emoji prefix (development only)
   * @param {string} emoji - Emoji prefix
   * @param {...any} args - Arguments to log
   */
  info: (emoji, ...args) => {
    if (isDev) {
      console.log(emoji, ...args);
    }
  },
};

export default logger;
