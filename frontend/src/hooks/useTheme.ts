import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Проверяем сохранённую тему
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) return saved;
    
    // Проверяем системные настройки
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
    
    // Применяем тему к документу
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};