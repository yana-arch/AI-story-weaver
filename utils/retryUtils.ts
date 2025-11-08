// Retry utility for API calls with exponential backoff
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = () => true,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or condition not met
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitteredDelay = delay + Math.random() * 1000;

      onRetry?.(attempt + 1, error);

      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError;
}

// Specific retry options for different types of operations
export const RETRY_OPTIONS = {
  // For network requests
  API_CALL: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, or server errors (5xx)
      const isNetworkError = !navigator.onLine || error.code === 'NETWORK_ERROR';
      const isTimeout = error.code === 'TIMEOUT' || error.name === 'TimeoutError';
      const isServerError = error.status >= 500;
      const isRateLimit = error.status === 429;

      return isNetworkError || isTimeout || isServerError || isRateLimit;
    },
  },

  // For critical operations that should retry more aggressively
  CRITICAL_OPERATION: {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 8000,
  },

  // For non-critical operations with fewer retries
  MINOR_OPERATION: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 5000,
  },
} as const;

// Connection status utilities
export function isOnline(): boolean {
  return navigator.onLine;
}

export function addOnlineListener(callback: () => void): () => void {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function addOfflineListener(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

// Retry with user feedback
export async function retryWithFeedback<T>(
  operation: () => Promise<T>,
  options: RetryOptions & {
    onProgress?: (attempt: number, maxRetries: number) => void;
    userMessage?: string;
  } = {}
): Promise<T> {
  const { onProgress, userMessage, ...retryOptions } = options;

  return withRetry(operation, {
    ...retryOptions,
    onRetry: (attempt, error) => {
      onProgress?.(attempt, retryOptions.maxRetries ?? 3);

      if (userMessage) {
        console.warn(`${userMessage} - Retry attempt ${attempt}`, error);
      }

      retryOptions.onRetry?.(attempt, error);
    },
  });
}
