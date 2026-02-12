import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ViewProvider } from './contexts/ViewContext';
import { router } from './router';

// ---------------------------------------------------------------------------
// Screenshot & Screen Recording Protection
// ---------------------------------------------------------------------------

// Add protection class to body
document.body.classList.add('screen-protected');

// Create screenshot overlay element
const screenshotOverlay = document.createElement('div');
screenshotOverlay.className = 'screenshot-overlay';
screenshotOverlay.textContent = 'Screenshots are not allowed';
document.body.appendChild(screenshotOverlay);

// Block PrintScreen key
document.addEventListener('keydown', (e: KeyboardEvent) => {
  // PrintScreen
  if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
    e.preventDefault();
    // Flash black overlay
    screenshotOverlay.classList.add('active');
    // Clear clipboard
    navigator.clipboard?.writeText?.('').catch(() => {});
    setTimeout(() => screenshotOverlay.classList.remove('active'), 1500);
  }
  // Block Ctrl+Shift+S (screenshot shortcuts)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
  }
  // Block Ctrl+Shift+I (dev tools - optional)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
    e.preventDefault();
  }
  // Block Ctrl+P (print)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
  }
});


// Detect visibility change (screen recording indicator)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    screenshotOverlay.classList.add('active');
  } else {
    screenshotOverlay.classList.remove('active');
  }
});

// ---------------------------------------------------------------------------
// App Render
// ---------------------------------------------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ViewProvider>
          <RouterProvider router={router} />
        </ViewProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
