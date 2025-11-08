import { useState, useCallback } from 'react';

export interface ErrorInfo {
  id: string;
  message: string;
  details?: string;
  recoverable: boolean;
  timestamp: number;
  retryAction?: () => void;
  context?: string;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback(
    (
      error: Error | string,
      options?: {
        recoverable?: boolean;
        context?: string;
        retryAction?: () => void;
      }
    ) => {
      const errorId = Date.now().toString();
      const errorMessage = error instanceof Error ? error.message : error;

      const errorInfo: ErrorInfo = {
        id: errorId,
        message: errorMessage,
        recoverable: options?.recoverable ?? true,
        timestamp: Date.now(),
        retryAction: options?.retryAction,
        context: options?.context,
      };

      setErrors((prev) => [errorInfo, ...prev]);

      // Auto-remove non-critical errors after 10 seconds unless they're recoverable
      if (!options?.recoverable) {
        setTimeout(() => {
          setErrors((prev) => prev.filter((e) => e.id !== errorId));
        }, 10000);
      }

      return errorId;
    },
    []
  );

  const removeError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const retryError = useCallback(
    (errorId: string) => {
      const error = errors.find((e) => e.id === errorId);
      if (error?.retryAction) {
        error.retryAction();
        removeError(errorId);
      }
    },
    [errors, removeError]
  );

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    retryError,
  };
};
