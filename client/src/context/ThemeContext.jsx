import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const accentThemes = {
  indigo: {
    name: 'Indigo',
    primary: '#6366f1',
    gradient: 'from-indigo-600 to-violet-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-500',
    ring: 'focus:ring-indigo-500'
  },
  emerald: {
    name: 'Emerald',
    primary: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-500',
    ring: 'focus:ring-emerald-500'
  },
  violet: {
    name: 'Violet',
    primary: '#8b5cf6',
    gradient: 'from-purple-600 to-pink-600',
    lightBg: 'bg-purple-50',
    border: 'border-purple-500',
    ring: 'focus:ring-purple-500'
  },
  rose: {
    name: 'Rose',
    primary: '#f43f5e',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50',
    border: 'border-rose-500',
    ring: 'focus:ring-rose-500'
  },
  sky: {
    name: 'Sky Blue',
    primary: '#0ea5e9',
    gradient: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-50',
    border: 'border-sky-500',
    ring: 'focus:ring-sky-500'
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('chatboat_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [accent, setAccent] = useState(() => {
    return localStorage.getItem('chatboat_accent') || 'indigo';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('chatboat_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('chatboat_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('chatboat_accent', accent);
  }, [accent]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        accent,
        setAccent,
        currentAccent: accentThemes[accent] || accentThemes.indigo
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
