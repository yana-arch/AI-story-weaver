import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  domNodes: number;
  timestamp: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let frames: number[] = [];

    const updateMetrics = () => {
      const now = performance.now();
      const fps = Math.round(1000 / (now - lastTime));
      lastTime = now;

      frames.push(fps);
      if (frames.length > 60) {
        frames = frames.slice(-60);
      }

      const avgFps = Math.round(frames.reduce((a, b) => a + b, 0) / frames.length);

      // Get memory usage
      const memInfo = (performance as any).memory;
      const memoryUsage = memInfo ? memInfo.usedJSHeapSize / 1024 / 1024 : 0;

      // Count DOM nodes
      const domNodes = document.getElementsByTagName('*').length;

      setMetrics((prev) => {
        const newMetrics = [
          ...prev,
          {
            fps: avgFps,
            memoryUsage,
            renderTime: performance.now(),
            domNodes,
            timestamp: Date.now(),
          },
        ].slice(-50); // Keep last 50 measurements

        return newMetrics;
      });

      frameCount++;
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'F' && process.env.NODE_ENV === 'development') {
        event.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestMetrics = metrics[metrics.length - 1] || {
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    domNodes: 0,
    timestamp: 0,
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryColor = (memory: number) => {
    if (memory < 100) return 'text-green-500';
    if (memory < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm font-medium"
        title="Show Performance Dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 min-w-[280px] font-mono text-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getFpsColor(latestMetrics.fps)}>{latestMetrics.fps}</span>
        </div>

        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={getMemoryColor(latestMetrics.memoryUsage)}>
            {latestMetrics.memoryUsage.toFixed(1)}MB
          </span>
        </div>

        <div className="flex justify-between">
          <span>DOM Nodes:</span>
          <span className="text-blue-400">{latestMetrics.domNodes.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span>Measurements:</span>
          <span className="text-purple-400">{metrics.length}</span>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-600">
          <p className="text-xs text-gray-400 text-center">Alt+F to toggle (development only)</p>
        </div>
      </div>

      {/* Keyboard shortcut */}
    </div>
  );
};
