import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage - synchronizes state with localStorage
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // ignore write errors
    }
  }, [key, storedValue]);

  const setValue = useCallback((value) => {
    setStoredValue((prev) =>
      typeof value === 'function' ? value(prev) : value
    );
  }, []);

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
