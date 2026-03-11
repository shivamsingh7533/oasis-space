import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function ThemeProvider({ children }) {
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (themeName) => {
      root.classList.remove('light', 'dark');
      root.classList.add(themeName);
    };

    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemPrefersDark ? 'dark' : 'light');

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => applyTheme(e.matches ? 'dark' : 'light');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // The wrapper uses CSS variables so it auto-adapts to theme
  return (
    <div className="w-full min-h-screen transition-colors duration-300"
         style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {children}
    </div>
  );
}
