/**
 * Debug Logger - Simple console wrapper
 * Logs are shown ONLY in development mode for security
 */

const isDev = import.meta.env.DEV;

export const debugWarn = (message: string, ...args: unknown[]): void => {
  if (isDev) console.warn(`[WARN] ${message}`, ...args);
};

export const debugError = (message: string, ...args: unknown[]): void => {
  if (isDev) console.error(`[ERROR] ${message}`, ...args);
};
