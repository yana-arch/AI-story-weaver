import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnline: number | null;
  lastOffline: number | null;
  connectionType: string | null;
  effectiveType: string | null;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    wasOffline: false,
    lastOnline: navigator.onLine ? Date.now() : null,
    lastOffline: navigator.onLine ? null : Date.now(),
    connectionType: null,
    effectiveType: null,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setNetworkStatus(prev => {
        const now = Date.now();
        return {
          ...prev,
          isOnline: true,
          wasOffline: !prev.isOnline,
          lastOnline: now,
        };
      });
    };

    const updateOfflineStatus = () => {
      setNetworkStatus(prev => {
        const now = Date.now();
        return {
          ...prev,
          isOnline: false,
          wasOffline: false,
          lastOffline: now,
        };
      });
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOfflineStatus);

    // Try to get connection information (for supported browsers)
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          connectionType: connection.type || null,
          effectiveType: connection.effectiveType || null,
        }));

        // Listen for connection changes
        connection.addEventListener('change', updateConnectionInfo);
      }
    };

    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOfflineStatus);

      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  // Helper functions
  const timeSinceOffline = () => {
    if (!networkStatus.lastOffline) return 0;
    return Date.now() - networkStatus.lastOffline;
  };

  const isRecentlyOffline = (thresholdMs: number = 30000) => {
    return !networkStatus.isOnline && timeSinceOffline() < thresholdMs;
  };

  const getNetworkInfo = () => {
    return {
      ...networkStatus,
      timeSinceOffline: timeSinceOffline(),
      isRecentlyOffline: isRecentlyOffline(),
    };
  };

  return {
    ...networkStatus,
    timeSinceOffline,
    isRecentlyOffline,
    getNetworkInfo,
  };
};
