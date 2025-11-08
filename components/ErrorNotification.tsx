import React, { useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, RefreshIcon, CloseIcon, CogIcon } from './icons';
import { useErrorHandler, ErrorInfo } from '../hooks/useErrorHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface ErrorNotificationProps {
  error: ErrorInfo;
  onDismiss: (id: string) => void;
  onRetry?: (id: string) => void;
  autoHide?: boolean;
  showRetry?: boolean;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  autoHide = true,
  showRetry = true,
}) => {
  const { isOnline, wasOffline } = useNetworkStatus();

  useEffect(() => {
    if (autoHide && !error.recoverable) {
      const timer = setTimeout(() => {
        onDismiss(error.id);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [autoHide, error.recoverable, error.id, onDismiss]);

  const handleRetry = () => {
    onRetry?.(error.id);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN');
  };

  const getErrorType = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'network';
    }
    if (lowerMessage.includes('api') || lowerMessage.includes('server')) {
      return 'api';
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
      return 'permission';
    }
    return 'general';
  };

  const errorType = getErrorType(error.message);

  return (
    <div className="error-notification animate-in slide-in-from-right-2 duration-300 fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {errorType === 'network' && !isOnline ? (
              <CogIcon className="w-5 h-5 text-destructive animate-pulse" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 text-destructive" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-destructive">
                {errorType === 'network' && !isOnline ? 'Mất kết nối mạng' : 'Lỗi'}
              </p>
              <p className="text-xs text-muted-foreground">{formatTimestamp(error.timestamp)}</p>
            </div>

            <p className="text-sm text-foreground mb-3">{error.message}</p>

            {error.details && (
              <details className="mb-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Chi tiết
                </summary>
                <p className="text-xs text-muted-foreground mt-1">{error.details}</p>
              </details>
            )}

            {errorType === 'network' && wasOffline && isOnline && (
              <div className="flex items-center gap-1 mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-700 dark:text-green-400">
                  Kết nối đã được khôi phục
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {showRetry && error.retryAction && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors"
                >
                  <RefreshIcon className="w-3 h-3" />
                  Thử lại
                </button>
              )}

              <button
                onClick={() => onDismiss(error.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted text-muted-foreground hover:bg-muted/80 rounded transition-colors"
              >
                <CloseIcon className="w-3 h-3" />
                Đóng
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {autoHide && !error.recoverable && (
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive animate-[shrink_8s_linear] rounded-full"
              style={{ animation: 'shrink 8s linear forwards' }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

interface ErrorNotificationContainerProps {
  className?: string;
}

export const ErrorNotificationContainer: React.FC<ErrorNotificationContainerProps> = ({
  className = '',
}) => {
  const { errors, removeError, retryError } = useErrorHandler();

  if (errors.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {errors.map((error) => (
        <ErrorNotification
          key={error.id}
          error={error}
          onDismiss={removeError}
          onRetry={retryError}
        />
      ))}
    </div>
  );
};

export default ErrorNotification;
