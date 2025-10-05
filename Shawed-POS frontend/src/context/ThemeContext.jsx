import React, { createContext, useState, useEffect } from 'react';

/**
 * ThemeContext manages the dark/light mode state for the application.
 * It persists the theme preference to localStorage and provides
 * theme toggle functionality throughout the app.
 */
export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('dukaan-theme');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to parse theme from localStorage', err);
    }
    return false; // Default to light mode
  });

  // Persist theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dukaan-theme', JSON.stringify(isDarkMode));
    
    // Apply theme to document root
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
