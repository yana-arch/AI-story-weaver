
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorNotificationContainer } from './components/ErrorNotification';
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
      <App />
      <ErrorNotificationContainer />
    </ErrorBoundary>
  </React.StrictMode>
);
