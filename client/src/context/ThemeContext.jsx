import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme());
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }

    localStorage.setItem('theme', theme);
    setDarkMode(theme === 'dark');

    if (theme === 'dark') {
      root.style.setProperty('--card-bg', '#1f1f1f');
      root.style.setProperty('--body-bg', '#141414');
      root.style.setProperty('--text-main', '#ffffff');
      root.style.setProperty('--border-color', '#303030');
    } else {
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--body-bg', '#f0f2f5');
      root.style.setProperty('--text-main', '#000000');
      root.style.setProperty('--border-color', '#f0f0f0');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const contextValue = {
    theme,
    darkMode,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
