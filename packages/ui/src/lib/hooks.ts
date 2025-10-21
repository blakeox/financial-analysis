/**
 * Custom React hooks for common UI patterns.
 * @module hooks
 */

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook to safely detect client-side hydration.
 * Prevents SSR/client mismatch issues by returning false until component is mounted.
 *
 * @returns true if component has hydrated on the client
 * @example
 * const hydrated = useHydrated();
 * if (!hydrated) return <Skeleton />;
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

/**
 * Hook to load and auto-refresh data from an API endpoint.
 *
 * @param url - API endpoint URL
 * @param options - Configuration options
 * @returns Object containing data, loading state, error, and manual refresh function
 * @example
 * const { data, loading, error, refresh } = useApiData<User>('/api/user', { refreshInterval: 30000 });
 */
export function useApiData<T>(
  url: string,
  options: {
    refreshInterval?: number;
    enabled?: boolean;
  } = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { refreshInterval, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      if (!cancelledRef.current) setData(json);
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    cancelledRef.current = false;
    load();

    let intervalId: number | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(load, refreshInterval) as unknown as number;
    }

    return () => {
      cancelledRef.current = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [load, refreshInterval]);

  return { data, loading, error, refresh: load };
}

/**
 * Hook to handle localStorage with type safety and SSR compatibility.
 *
 * @param key - localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 * @example
 * const [settings, setSettings, clearSettings] = useLocalStorage('user-settings', defaultSettings);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook to detect when user presses Escape key.
 *
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the listener is active
 * @example
 * useEscapeKey(() => setModalOpen(false), modalOpen);
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [callback, enabled]);
}

/**
 * Hook to auto-scroll element to bottom when content changes.
 *
 * @param dependencies - Array of values that trigger scroll when they change
 * @returns Ref to attach to the scrollable element
 * @example
 * const scrollRef = useAutoScroll([messages]);
 * <div ref={scrollRef}>...</div>
 */
export function useAutoScroll<T extends HTMLElement>(
  dependencies: unknown[]
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [...dependencies]);

  return ref;
}

/**
 * Hook for debounced value updates.
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to track previous value of a variable.
 *
 * @param value - Current value
 * @returns Previous value
 * @example
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for async operation with loading/error states.
 *
 * @returns Object with execute function and state
 * @example
 * const { execute, loading, error } = useAsync();
 * await execute(() => api.saveData(data));
 */
export function useAsync<T>(): {
  execute: (asyncFunction: () => Promise<T>) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, data };
}
