import { useState, useEffect } from 'react';

// Real localStorage-backed state — previously themeMode, textScale,
// highContrast, and vesselSpecs all silently reset to their defaults on
// every page reload, since MarineContext held them as plain useState with
// no persistence at all.
export function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // private browsing / storage disabled — the app still works, it just won't persist
    }
  }, [key, value]);

  return [value, setValue];
}
