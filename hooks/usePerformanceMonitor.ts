import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface PerformanceMetrics {
  renderCount: number;
  renderTime: number;
  lastRenderAt: number;
  memoryUsage?: number;
  componentName: string;
}

export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    lastRenderAt: 0,
    componentName,
  });
  const renderStartTimeRef = useRef<number>(0);
  const lastRenderCountRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    lastRenderAt: 0,
    componentName,
    memoryUsage: 0,
  });

  useLayoutEffect(() => {
    renderStartTimeRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTimeRef.current;
      lastRenderCountRef.current += 1;
      metricsRef.current = {
        renderCount: lastRenderCountRef.current,
        renderTime,
        lastRenderAt: Date.now(),
        componentName,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      };

      if (renderTime > 16) {
        console.warn(`🚨 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      if (lastRenderCountRef.current % 10 === 0) {
        console.info(`📊 ${componentName} render count: ${lastRenderCountRef.current}`);
      }
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(metricsRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [componentName]);

  // Log memory usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = memInfo;
        console.info(`${componentName} Memory Usage:`, {
          used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
          percent: `${((usedJSHeapSize / totalJSHeapSize) * 100).toFixed(1)}%`,
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [componentName]);

  return metrics;
};

// Performance tracking for API calls
export const useApiPerformanceMonitor = (apiName: string) => {
  const [apiMetrics, setApiMetrics] = useState({
    callCount: 0,
    totalTime: 0,
    averageTime: 0,
    lastCallAt: 0,
    successCount: 0,
    errorCount: 0,
  });

  const startApiCall = () => {
    return performance.now();
  };

  const endApiCall = (startTime: number, success: boolean = true) => {
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

    console.info(`🔍 ${apiName} took ${callTime.toFixed(2)}ms`);

    // Warn for slow API calls
    if (callTime > 2000) {
      console.warn(`🚨 Slow ${apiName} call: ${callTime.toFixed(2)}ms`);
    }
  };

  return {
    apiMetrics,
    startApiCall,
    endApiCall,
  };
};

// Component memory leak detector
export const useMemoryLeakDetector = (componentName: string) => {
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;

    if (renderCountRef.current > 100) {
      console.warn(`⚠️  High render count for ${componentName}: ${renderCountRef.current} renders`);
    }
  });

  return {
    renderCount: renderCountRef.current,
  };
};
