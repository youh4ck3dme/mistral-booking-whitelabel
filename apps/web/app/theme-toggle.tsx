'use client';

import { useEffect, useState } from 'react';

import styles from './theme-toggle.module.css';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'nexify-theme';
const THEME_COLORS: Record<Theme, string> = {
  dark: '#0a0a0a',
  light: '#f7f4f0',
};

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  let themeMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"][data-nexify-dynamic]'
  );

  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    themeMeta.setAttribute('data-nexify-dynamic', 'true');
    document.head.appendChild(themeMeta);
  }

  themeMeta.content = THEME_COLORS[theme];
}

function getPreferredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    applyTheme(preferredTheme);
    setTheme(preferredTheme);
    setIsReady(true);
  }, []);

  const handleToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className={`${styles.toggle} ${theme === 'light' ? styles.light : ''}`}
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      <span className={styles.copy}>
        <span className={styles.label}>Theme</span>
        <span className={styles.value}>{isReady ? theme : '...'}</span>
      </span>
    </button>
  );
}
