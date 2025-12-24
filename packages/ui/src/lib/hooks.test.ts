import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useHydrated,
  useApiData,
  useLocalStorage,
  useEscapeKey,
  useAutoScroll,
  useDebounce,
  usePrevious,
  useAsync,
} from './hooks';

describe('hooks', () => {
  describe('useHydrated', () => {
    it('returns true after hydration', async () => {
      const { result } = renderHook(() => useHydrated());
      
      // In test environment, effect runs and sets hydrated to true
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('remains true after initial hydration', async () => {
      const { result } = renderHook(() => useHydrated());
      
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
      
      // Should stay true
      expect(result.current).toBe(true);
    });
  });

  describe('useApiData', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fetches data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useApiData<typeof mockData>('/api/test'));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useApiData('/api/test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toContain('HTTP 404');
    });

    it('handles network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useApiData('/api/test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('can manually refresh data', async () => {
      const mockData1 = { value: 1 };
      const mockData2 = { value: 2 };
      
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        });

      const { result } = renderHook(() => useApiData<typeof mockData1>('/api/test'));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });
    });

    it('respects enabled option', async () => {
      const mockData = { value: 1 };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() =>
        useApiData('/api/test', { enabled: false })
      );

      // Should not fetch when disabled
      expect(result.current.loading).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('cleans up on unmount', async () => {
      const mockData = { value: 1 };
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockData,
                }),
              100
            )
          )
      );

      const { unmount } = renderHook(() => useApiData('/api/test'));

      // Unmount before fetch completes
      unmount();

      // Wait to ensure no state updates after unmount
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      // If we get here without errors, cleanup worked
      expect(true).toBe(true);
    });
  });

  describe('useLocalStorage', () => {
    const createInMemoryStorage = (): Storage => {
      const store = new Map<string, string>();

      return {
        get length() {
          return store.size;
        },
        clear() {
          store.clear();
        },
        getItem(key: string) {
          return store.has(key) ? (store.get(key) ?? null) : null;
        },
        key(index: number) {
          return Array.from(store.keys())[index] ?? null;
        },
        removeItem(key: string) {
          store.delete(key);
        },
        setItem(key: string, value: string) {
          store.set(key, String(value));
        },
      } as unknown as Storage;
    };

    let originalWindowLocalStorageDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalWindowLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

      const storage = createInMemoryStorage();
      vi.stubGlobal('localStorage', storage);

      try {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          enumerable: true,
          value: storage,
        });
      } catch {
        // Ignore if the test environment prevents overriding window.localStorage.
      }

      const maybeStorage = localStorage as unknown as Partial<Storage>;

      if (typeof maybeStorage.clear === 'function') {
        maybeStorage.clear();
        return;
      }

      if (
        typeof maybeStorage.length === 'number' &&
        typeof maybeStorage.key === 'function' &&
        typeof maybeStorage.removeItem === 'function'
      ) {
        for (let i = maybeStorage.length - 1; i >= 0; i -= 1) {
          const key = maybeStorage.key(i);
          if (key != null) maybeStorage.removeItem(key);
        }
        return;
      }

      // Minimal fallback for shims that only implement getItem/setItem/removeItem.
      maybeStorage.removeItem?.('test-key');
    });

    afterEach(() => {
      vi.unstubAllGlobals();

      try {
        if (originalWindowLocalStorageDescriptor != null) {
          Object.defineProperty(window, 'localStorage', originalWindowLocalStorageDescriptor);
        } else {
          // If we created an own property on window.localStorage, remove it.
          // (The original may be on the prototype chain.)
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete (window as unknown as { localStorage?: unknown }).localStorage;
        }
      } catch {
        // Ignore restoration failures; vitest will still restore global stubs.
      }
    });

    it('returns initial value when key does not exist', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default-value')
      );

      expect(result.current[0]).toBe('default-value');
    });

    it('returns stored value when key exists', () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'));

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default-value')
      );

      expect(result.current[0]).toBe('stored-value');
    });

    it('updates localStorage when value changes', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
    });

    it('supports function updater', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 10)
      );

      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(15);
      expect(localStorage.getItem('test-key')).toBe('15');
    });

    it('removes value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('stored'));

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default')
      );

      act(() => {
        result.current[2](); // removeValue
      });

      expect(result.current[0]).toBe('default');
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('handles complex objects', () => {
      const complexObject = { id: 1, nested: { value: 'test' } };

      const { result } = renderHook(() =>
        useLocalStorage('test-key', complexObject)
      );

      act(() => {
        result.current[1]({ id: 2, nested: { value: 'updated' } });
      });

      expect(result.current[0]).toEqual({ id: 2, nested: { value: 'updated' } });
    });

    it('handles malformed JSON gracefully', () => {
      localStorage.setItem('test-key', 'invalid-json{');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'fallback')
      );

      expect(result.current[0]).toBe('fallback');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('useEscapeKey', () => {
    it('calls callback when Escape key is pressed', () => {
      const callback = vi.fn();
      renderHook(() => useEscapeKey(callback));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not call callback for other keys', () => {
      const callback = vi.fn();
      renderHook(() => useEscapeKey(callback));

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback when disabled', () => {
      const callback = vi.fn();
      renderHook(() => useEscapeKey(callback, false));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('updates when enabled state changes', () => {
      const callback = vi.fn();
      const { rerender } = renderHook(
        ({ enabled }) => useEscapeKey(callback, enabled),
        { initialProps: { enabled: false } }
      );

      // Disabled - should not call
      const event1 = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event1);
      expect(callback).not.toHaveBeenCalled();

      // Enable and test again
      rerender({ enabled: true });
      const event2 = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event2);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('cleans up event listener on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useEscapeKey(callback));

      unmount();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('useAutoScroll', () => {
    it('returns a ref object', () => {
      const { result } = renderHook(() => useAutoScroll([1, 2, 3]));

      expect(result.current).toHaveProperty('current');
    });

    it('scrolls element to bottom when dependencies change', async () => {
      const { result, rerender } = renderHook(
        ({ deps }) => useAutoScroll(deps),
        { initialProps: { deps: [1] } }
      );

      // Mock element with scroll properties
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 1000,
      };
      result.current.current = mockElement as unknown as HTMLDivElement;

      // Change dependencies to trigger scroll
      rerender({ deps: [2] });

      await waitFor(() => {
        expect(mockElement.scrollTop).toBe(1000);
      });
    });

    it('does nothing when ref is not attached', () => {
      const { rerender } = renderHook(
        ({ deps }) => useAutoScroll(deps),
        { initialProps: { deps: [1] } }
      );

      // Change dependencies with no element attached
      rerender({ deps: [2] });

      // Should not throw
      expect(true).toBe(true);
    });

    it('updates scroll on multiple dependency changes', async () => {
      const { result, rerender } = renderHook(
        ({ deps }) => useAutoScroll(deps),
        { initialProps: { deps: [1] } }
      );

      const mockElement = {
        scrollTop: 0,
        scrollHeight: 1000,
      };
      result.current.current = mockElement as unknown as HTMLDivElement;

      rerender({ deps: [2] });
      await waitFor(() => {
        expect(mockElement.scrollTop).toBe(1000);
      });

      mockElement.scrollHeight = 2000;
      rerender({ deps: [3] });
      await waitFor(() => {
        expect(mockElement.scrollTop).toBe(2000);
      });
    });
  });

  describe('useDebounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));

      expect(result.current).toBe('initial');
    });

    it('debounces value updates', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated' });
      expect(result.current).toBe('initial'); // Still old value

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('cancels previous timeout on rapid updates', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'update1' });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      rerender({ value: 'update2' });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Only 600ms passed total, but timeout was reset
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe('update2');
    });

    it('handles different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      );

      rerender({ value: 'updated', delay: 300 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('updated');
    });

    it('handles complex object values', () => {
      const obj1 = { id: 1, name: 'Test' };
      const obj2 = { id: 2, name: 'Updated' };

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: obj1 } }
      );

      expect(result.current).toEqual(obj1);

      rerender({ value: obj2 });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(obj2);
    });
  });

  describe('usePrevious', () => {
    it('returns undefined on first render', () => {
      const { result } = renderHook(() => usePrevious('initial'));

      expect(result.current).toBeUndefined();
    });

    it('returns previous value after update', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');
    });

    it('tracks value changes over multiple renders', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 1 } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 2 });
      expect(result.current).toBe(1);

      rerender({ value: 3 });
      expect(result.current).toBe(2);

      rerender({ value: 4 });
      expect(result.current).toBe(3);
    });

    it('handles complex objects', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };

      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: obj1 } }
      );

      rerender({ value: obj2 });
      expect(result.current).toBe(obj1);
    });
  });

  describe('useAsync', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useAsync());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('executes async function successfully', async () => {
      const { result } = renderHook(() => useAsync<string>());

      const asyncFn = vi.fn().mockResolvedValue('success');

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });

    it('sets loading to false after execution completes', async () => {
      const { result } = renderHook(() => useAsync<string>());

      const asyncFn = () => Promise.resolve('done');

      // Initially not loading
      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      // Loading is false after completion
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('done');
    });

    it('handles errors correctly', async () => {
      const { result } = renderHook(() => useAsync());

      const asyncFn = vi.fn().mockRejectedValue(new Error('Test error'));

      await act(async () => {
        const returnValue = await result.current.execute(asyncFn);
        expect(returnValue).toBeNull();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Test error');
      expect(result.current.data).toBeNull();
    });

    it('handles non-Error rejections', async () => {
      const { result } = renderHook(() => useAsync());

      const asyncFn = vi.fn().mockRejectedValue('String error');

      await act(async () => {
        await result.current.execute(asyncFn);
      });

      expect(result.current.error).toBe('An error occurred');
    });

    it('clears previous error on new execution', async () => {
      const { result } = renderHook(() => useAsync<string>());

      // First execution fails
      await act(async () => {
        await result.current.execute(() =>
          Promise.reject(new Error('First error'))
        );
      });

      expect(result.current.error).toBe('First error');

      // Second execution succeeds
      await act(async () => {
        await result.current.execute(() => Promise.resolve('success'));
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });

    it('can execute multiple times', async () => {
      const { result } = renderHook(() => useAsync<number>());

      await act(async () => {
        await result.current.execute(() => Promise.resolve(1));
      });
      expect(result.current.data).toBe(1);

      await act(async () => {
        await result.current.execute(() => Promise.resolve(2));
      });
      expect(result.current.data).toBe(2);

      await act(async () => {
        await result.current.execute(() => Promise.resolve(3));
      });
      expect(result.current.data).toBe(3);
    });
  });
});
