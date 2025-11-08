import { useEffect, useRef, useState, useCallback } from 'react';
import { useLogger } from '../utils/logger';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  memoryUsage?: number;
  componentName: string;
  timestamp: number;
}

interface ApiMetrics {
  callCount: number;
  totalTime: number;
  averageTime: number;
  successCount: number;
  errorCount: number;
  lastCallAt: number;
  endpoint?: string;
}

interface WebVitalsMetrics {
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  ttfb?: number; // Time to First Byte
}

export const useEnhancedPerformanceMonitor = (componentName: string) => {
  const logger = useLogger();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
    componentName,
    timestamp: Date.now(),
  });

  const renderStartTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const totalRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    renderStartTimeRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTimeRef.current;
      renderCountRef.current += 1;
      totalRenderTimeRef.current += renderTime;

      const newMetrics: PerformanceMetrics = {
        renderCount: renderCountRef.current,
        averageRenderTime: totalRenderTimeRef.current / renderCountRef.current,
        lastRenderTime: renderTime,
        totalRenderTime: totalRenderTimeRef.current,
        componentName,
        timestamp: Date.now(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      };

      setMetrics(newMetrics);

      // Log performance warnings
      if (renderTime > 16) {
        logger.warn('Performance', `Slow render detected in ${componentName}`, {
          renderTime,
          threshold: 16,
          renderCount: renderCountRef.current,
        });
      }

      // Log memory usage periodically
      if (renderCountRef.current % 50 === 0) {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = memInfo;
          logger.performance('MemoryUsage', 0, {
            component: componentName,
            used: usedJSHeapSize,
            total: totalJSHeapSize,
            limit: jsHeapSizeLimit,
            usagePercent: (usedJSHeapSize / totalJSHeapSize) * 100,
          });
        }
      }

      // Log render count milestones
      if (renderCountRef.current % 100 === 0) {
        logger.info('Performance', `${componentName} render milestone`, {
          renderCount: renderCountRef.current,
          averageRenderTime: newMetrics.averageRenderTime,
        });
      }
    };
  });

  const logCustomMetric = useCallback(
    (name: string, value: number, data?: any) => {
      logger.performance(name, value, { component: componentName, ...data });
    },
    [componentName, logger]
  );

  return {
    metrics,
    logCustomMetric,
  };
};

// Enhanced API performance monitoring
export const useEnhancedApiPerformanceMonitor = (apiName: string) => {
  const logger = useLogger();
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics>({
    callCount: 0,
    totalTime: 0,
    averageTime: 0,
    successCount: 0,
    errorCount: 0,
    lastCallAt: 0,
  });

  const startApiCall = useCallback((endpoint?: string) => {
    const startTime = performance.now();
    return { startTime, endpoint };
  }, []);

  const endApiCall = useCallback(
    (callData: { startTime: number; endpoint?: string }, success: boolean = true) => {
      const { startTime, endpoint } = callData;
      const endTime = performance.now();
      const callTime = endTime - startTime;

      setApiMetrics((prev) => {
        const newCallCount = prev.callCount + 1;
        const newTotalTime = prev.totalTime + callTime;

        return {
          callCount: newCallCount,
          totalTime: newTotalTime,
          averageTime: newTotalTime / newCallCount,
          lastCallAt: Date.now(),
          successCount: success ? prev.successCount + 1 : prev.successCount,
          errorCount: success ? prev.errorCount : prev.errorCount + 1,
        };
      });

      // Log API call performance
      logger.performance('APICall', callTime, {
        apiName,
        success,
        endpoint,
        callCount: apiMetrics.callCount + 1,
      });

      // Warn for slow API calls
      if (callTime > 2000) {
        logger.warn('Performance', `Slow API call detected: ${apiName}`, {
          callTime,
          threshold: 2000,
          apiName,
          endpoint,
        });
      }

      return callTime;
    },
    [apiName, apiMetrics.callCount, logger]
  );

  return {
    apiMetrics,
    startApiCall,
    endApiCall,
  };
};

// Web Vitals monitoring hook
export const useWebVitals = () => {
  const logger = useLogger();
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});

  useEffect(() => {
    // First Contentful Paint
    const observerFCP = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries[0];
      if (fcp) {
        const fcpValue = fcp.startTime;
        setWebVitals((prev) => ({ ...prev, fcp: fcpValue }));
        logger.performance('WebVitals', fcpValue, { metric: 'FCP' });
      }
    });

    // Largest Contentful Paint
    const observerLCP = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      if (lcp) {
        const lcpValue = lcp.startTime;
        setWebVitals((prev) => ({ ...prev, lcp: lcpValue }));
        logger.performance('WebVitals', lcpValue, { metric: 'LCP' });
      }
    });

    // Cumulative Layout Shift
    const observerCLS = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      setWebVitals((prev) => ({ ...prev, cls: clsValue }));
      logger.performance('WebVitals', clsValue, { metric: 'CLS' });
    });

    // First Input Delay
    const observerFID = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidValue = (entry as any).processingStart - entry.startTime;
        setWebVitals((prev) => ({ ...prev, fid: fidValue }));
        logger.performance('WebVitals', fidValue, { metric: 'FID' });
      });
    });

    try {
      observerFCP.observe({ entryTypes: ['paint'] });
      observerLCP.observe({ entryTypes: ['largest-contentful-paint'] });
      observerCLS.observe({ entryTypes: ['layout-shift'] });
      observerFID.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      logger.warn('Performance', 'Web Vitals monitoring not fully supported', { error });
    }

    return () => {
      observerFCP.disconnect();
      observerLCP.disconnect();
      observerCLS.disconnect();
      observerFID.disconnect();
    };
  }, [logger]);

  return webVitals;
};

// Bundle size monitoring hook
export const useBundleAnalyzer = () => {
  const logger = useLogger();

  useEffect(() => {
    // Monitor bundle loading performance
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      const resourceEntries = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];

      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];

        logger.performance('NavigationTiming', nav.loadEventEnd - nav.fetchStart, {
          metric: 'TotalLoadTime',
          domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
          loadComplete: nav.loadEventEnd - nav.fetchStart,
        });
      }

      // Analyze resource loading
      const jsFiles = resourceEntries.filter(
        (resource) => resource.name.includes('.js') && !resource.name.includes('node_modules')
      );

      jsFiles.forEach((jsFile) => {
        logger.performance('ResourceLoading', jsFile.duration, {
          resource: jsFile.name,
          size: jsFile.transferSize,
          resourceType: 'JavaScript',
        });
      });
    }
  }, [logger]);
};

// Memory leak detection hook
export const useMemoryLeakDetector = (componentName: string, threshold: number = 100) => {
  const logger = useLogger();
  const renderCountRef = useRef(0);
  const lastMemoryUsageRef = useRef<number>(0);

  useEffect(() => {
    renderCountRef.current += 1;

    if (renderCountRef.current > threshold) {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;

      logger.warn('Memory', `High render count detected for ${componentName}`, {
        renderCount: renderCountRef.current,
        threshold,
        currentMemory,
        memoryIncrease: currentMemory - lastMemoryUsageRef.current,
      });

      lastMemoryUsageRef.current = currentMemory;
    }
  });

  return {
    renderCount: renderCountRef.current,
    isPotentialLeak: renderCountRef.current > threshold,
  };
};

// User interaction performance monitoring
export const useInteractionPerformanceMonitor = () => {
  const logger = useLogger();

  const trackInteraction = useCallback(
    (interactionType: string, handler: () => void | Promise<void>) => {
      return async () => {
        const endTimer = logger.time(`Interaction:${interactionType}`);

        try {
          await handler();
          const duration = endTimer();

          logger.userAction(`Interaction:${interactionType}`, {
            duration,
            success: true,
          });
        } catch (error) {
          const duration = endTimer();

          logger.error('UserInteraction', `Interaction ${interactionType} failed`, error as Error, {
            interactionType,
            duration,
          });
        }
      };
    },
    [logger]
  );

  return { trackInteraction };
};

// Component lifecycle performance monitoring
export const useLifecyclePerformanceMonitor = (componentName: string) => {
  const logger = useLogger();
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = performance.now();

    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTimeRef.current;

      logger.performance('ComponentLifecycle', totalLifetime, {
        component: componentName,
        event: 'unmount',
        lifetime: totalLifetime,
      });
    };
  }, [componentName, logger]);

  const logMount = useCallback(() => {
    mountTimeRef.current = performance.now();

    logger.performance('ComponentLifecycle', 0, {
      component: componentName,
      event: 'mount',
    });
  }, [componentName, logger]);

  return { logMount };
};
