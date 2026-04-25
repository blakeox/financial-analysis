import { afterEach, beforeEach, vi } from 'vitest';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

const storageState = new Map<string, string>();
const mediaQueryListeners = new Map<string, Set<MatchMediaListener>>();
const mediaQueryMatches = new Map<string, boolean>();

const localStorageMock: Storage = {
  get length() {
    return storageState.size;
  },
  clear: vi.fn(() => {
    storageState.clear();
  }),
  getItem: vi.fn((key: string) => storageState.get(String(key)) ?? null),
  key: vi.fn((index: number) => Array.from(storageState.keys())[index] ?? null),
  removeItem: vi.fn((key: string) => {
    storageState.delete(String(key));
  }),
  setItem: vi.fn((key: string, value: string) => {
    storageState.set(String(key), String(value));
  }),
};

const createMediaQueryList = (query: string): MediaQueryList => {
  const getListeners = () => {
    const existing = mediaQueryListeners.get(query);
    if (existing) {
      return existing;
    }
    const created = new Set<MatchMediaListener>();
    mediaQueryListeners.set(query, created);
    return created;
  };

  const addListener = (listener: MatchMediaListener) => {
    getListeners().add(listener);
  };

  const removeListener = (listener: MatchMediaListener) => {
    getListeners().delete(listener);
  };

  return {
    get matches() {
      return mediaQueryMatches.get(query) ?? false;
    },
    media: query,
    onchange: null,
    addListener,
    removeListener,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === 'change' && typeof listener === 'function') {
        addListener(listener as MatchMediaListener);
      }
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === 'change' && typeof listener === 'function') {
        removeListener(listener as MatchMediaListener);
      }
    },
    dispatchEvent: (event: Event) => {
      if (!(event instanceof Event)) {
        return false;
      }
      for (const listener of getListeners()) {
        listener(event as MediaQueryListEvent);
      }
      return true;
    },
  };
};

const matchMediaMock = vi.fn((query: string) => createMediaQueryList(query));

class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) =>
  window.setTimeout(() => callback(Date.now()), 0)
);

const cancelAnimationFrameMock = vi.fn((handle: number) => {
  window.clearTimeout(handle);
});

const scrollIntoViewMock = vi.fn();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: localStorageMock,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: localStorageMock,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: matchMediaMock,
});

Object.defineProperty(window, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, 'requestAnimationFrame', {
  configurable: true,
  writable: true,
  value: requestAnimationFrameMock,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  configurable: true,
  writable: true,
  value: cancelAnimationFrameMock,
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: scrollIntoViewMock,
});

beforeEach(() => {
  storageState.clear();
  mediaQueryListeners.clear();
  mediaQueryMatches.clear();
  matchMediaMock.mockClear();
  requestAnimationFrameMock.mockClear();
  cancelAnimationFrameMock.mockClear();
  scrollIntoViewMock.mockClear();
  vi.clearAllTimers();
});

afterEach(() => {
  storageState.clear();
});

export const testBrowser = {
  localStorage: localStorageMock,
  matchMediaMock,
  setMediaQueryMatch(query: string, matches: boolean) {
    mediaQueryMatches.set(query, matches);
  },
  emitMediaQueryChange(query: string, matches: boolean) {
    mediaQueryMatches.set(query, matches);
    const event = { matches, media: query } as MediaQueryListEvent;
    for (const listener of mediaQueryListeners.get(query) ?? []) {
      listener(event);
    }
  },
  scrollIntoViewMock,
};
