
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorNotificationContainer } from './components/ErrorNotification';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import './index.css';
// Fix: The error 'File 'file:///App.tsx' is not a module' is resolved by providing a valid App component in App.tsx.
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // In a production app, you might want to send this to an error reporting service
      }}
    >
      <React.Profiler id="App" onRender={onPerformanceRender}>
        <App />
      </React.Profiler>
      <ErrorNotificationContainer />
      {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
    </ErrorBoundary>
  </React.StrictMode>
);

// Performance Profiler callback
function onPerformanceRender(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  // Log only slow renders (>5ms) to avoid console spam
  if (actualDuration > 5) {
    console.info(`🎨 ${phase} ${id}: ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`);
  }

  // Warn for very slow renders (>20ms)
  if (actualDuration > 20) {
    console.warn(`🚨 Slow render in ${id}: ${actualDuration.toFixed(2)}ms`);
  }
}
