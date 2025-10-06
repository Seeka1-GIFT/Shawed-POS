import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { RealDataProvider } from './context/RealDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import './i18n'; // Import i18n configuration
import './index.css';

// Render the application into the root element. Wrap everything in
// DataProvider so that the global state is accessible throughout
// the component tree. BrowserRouter enables client side routing.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider>
        <RealDataProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RealDataProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);
