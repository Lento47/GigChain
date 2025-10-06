/**
 * GigChain Logger Utility
 * Centralized logging with environment-aware behavior
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    // In production, only log warnings and errors
    this.level = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true';
  }

  _shouldLog(level) {
    return this.enabled && level >= this.level;
  }

  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[GigChain ${level}] ${timestamp}`;
    
    if (args.length > 0) {
      return [prefix, message, ...args];
    }
    return [prefix, message];
  }

  debug(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this._formatMessage('DEBUG', message, ...args));
    }
  }

  info(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      console.info(...this._formatMessage('INFO', message, ...args));
    }
  }

  warn(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
      console.warn(...this._formatMessage('WARN', message, ...args));
    }
  }

  error(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      console.error(...this._formatMessage('ERROR', message, ...args));
    }
  }

  // Analytics tracking (can be extended with actual analytics service)
  analytics(event, data = {}) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      console.log(...this._formatMessage('ANALYTICS', `Event: ${event}`, data));
    }
    
    // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
    // Example: window.gtag?.('event', event, data);
  }

  // User action tracking
  action(actionName, details = {}) {
    this.info(`User action: ${actionName}`, details);
    this.analytics(`user_action_${actionName}`, details);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger, LOG_LEVELS };
