import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress MetaMask internal errors that don't affect functionality
// These are harmless errors from the MetaMask extension's polyfill.js
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || '';
  
  // Suppress MetaMask internal errors
  if (
    errorMessage.includes('Internal error') &&
    (event.reason?.stack?.includes('polyfill.js') || 
     event.reason?.stack?.includes('content.js'))
  ) {
    console.debug('Suppressed MetaMask internal error:', errorMessage);
    event.preventDefault(); // Prevent the error from being logged to console
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
