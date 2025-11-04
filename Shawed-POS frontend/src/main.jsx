import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { RealDataProvider } from './context/RealDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './components/ToastProvider';
import './i18n'; // Import i18n configuration
import './index.css';

// Silence noisy unhandled rejections coming from browser extensions
// (e.g. translate/save-page content scripts). These errors are external
// to the app and can confuse users. We ignore only known patterns.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const msg = String(event?.reason || '');
      const isExt = msg.includes('translate-page') || msg.includes('save-page') || msg.includes('content-all');
      if (isExt) {
        event.preventDefault();
      }
    } catch (_) {
      // no-op
    }
  });
}

// Render the application into the root element. Wrap everything in
// DataProvider so that the global state is accessible throughout
// the component tree. BrowserRouter enables client side routing.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider>
        <ToastProvider>
          <RealDataProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </RealDataProvider>
        </ToastProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);
