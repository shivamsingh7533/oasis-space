import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '../redux/theme/themeSlice';

export default function ThemeProvider({ children }) {
  const { theme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Function to apply the actual CSS class
    const applyTheme = (themeName) => {
      root.classList.remove('light', 'dark');
      root.classList.add(themeName);
    };

    if (theme === 'system') {
      // 1. Check current system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemPrefersDark ? 'dark' : 'light');

      // 2. Listen for future system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // If forced 'light' or 'dark'
      applyTheme(theme);
    }
  }, [theme]);

  // Give children access to the rest of the app
  return <div className="theme-wrapper w-full min-h-screen text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 transition-colors duration-300">{children}</div>;
}
