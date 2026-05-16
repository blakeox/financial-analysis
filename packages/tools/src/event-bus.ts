export type EventMap = Record<string, unknown>;

type Listener<Payload> = (payload: Payload) => void;

type EventKey<Events extends EventMap> = Extract<keyof Events, string>;

export interface TypedEventBus<Events extends EventMap> {
  emit<K extends EventKey<Events>>(type: K, payload: Events[K]): void;
  on<K extends EventKey<Events>>(type: K, listener: Listener<Events[K]>): () => void;
  once<K extends EventKey<Events>>(type: K, listener: Listener<Events[K]>): () => void;
  off<K extends EventKey<Events>>(type: K, listener: Listener<Events[K]>): void;
  clearListeners(type?: EventKey<Events>): void;
}

export function createEventBus<Events extends EventMap>(): TypedEventBus<Events> {
  const listeners = new Map<string, Set<Listener<unknown>>>();

  const removeListener = <K extends EventKey<Events>>(
    type: K,
    listener: Listener<Events[K]>
  ): void => {
    const eventName = type as string;
    const handlers = listeners.get(eventName);
    if (!handlers) {
      return;
    }
    handlers.delete(listener as Listener<unknown>);
    if (handlers.size === 0) {
      listeners.delete(eventName);
    }
  };

  const emit = <K extends EventKey<Events>>(type: K, payload: Events[K]): void => {
    const eventName = type as string;
    const handlers = listeners.get(eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }
    for (const handler of Array.from(handlers)) {
      (handler as Listener<Events[K]>)(payload);
    }
  };

  const on = <K extends EventKey<Events>>(type: K, listener: Listener<Events[K]>): (() => void) => {
    const eventName = type as string;
    const handlers = listeners.get(eventName) ?? new Set<Listener<unknown>>();
    handlers.add(listener as Listener<unknown>);
    listeners.set(eventName, handlers);
    return () => removeListener(type, listener);
  };

  const off = <K extends EventKey<Events>>(type: K, listener: Listener<Events[K]>): void => {
    removeListener(type, listener);
  };

  const once = <K extends EventKey<Events>>(
    type: K,
    listener: Listener<Events[K]>
  ): (() => void) => {
    const wrapper: Listener<Events[K]> = (payload) => {
      off(type, wrapper);
      listener(payload);
    };
    return on(type, wrapper);
  };

  const clearListeners = (type?: EventKey<Events>): void => {
    if (typeof type === 'string') {
      listeners.delete(type);
      return;
    }
    listeners.clear();
  };

  return {
    emit,
    on,
    once,
    off,
    clearListeners,
  };
}

export type BusEvent<Events extends EventMap, K extends EventKey<Events>> = Events[K];

export const GLOBAL_BUS_SYMBOL = Symbol.for('financial-analysis.event-bus');

export function getOrCreateGlobalBus<Events extends EventMap>(
  initializer: () => TypedEventBus<Events>
): TypedEventBus<Events> {
  type GlobalWithBus = typeof globalThis & {
    [GLOBAL_BUS_SYMBOL]?: TypedEventBus<Events>;
  };

  const globalScope = globalThis as GlobalWithBus;

  if (globalScope[GLOBAL_BUS_SYMBOL]) {
    return globalScope[GLOBAL_BUS_SYMBOL] as TypedEventBus<Events>;
  }

  const bus = initializer();
  globalScope[GLOBAL_BUS_SYMBOL] = bus;

  // Attach to global scope for debugging in browser environments. Use globalThis
  // to avoid referencing the `window` global directly (packages/tools may be
  // typechecked without DOM libs). Cast to `any` so this is a no-op in non-
  // browser runtimes.
  try {
    const g = globalThis as unknown as Record<string, unknown> & {
      __appEventBus?: TypedEventBus<Events>;
    };
    g.__appEventBus = bus;
  } catch {
    // ignore - some runtimes may restrict globalThis assignment
  }

  return bus;
}

export type SerializedContext = Record<string, unknown>;

export interface ChatContextEvent {
  contextKey: string | null;
  label: string | null;
  data: SerializedContext | null;
  source?: 'legacy' | 'model-selection' | 'form' | 'chat';
}

export interface ChatStateEvent {
  isOpen: boolean;
  source?: 'panel' | 'external' | 'form' | 'models' | 'test' | 'playwright' | 'analytics';
}

export interface ChatToolsUpdateEvent {
  tools: Array<{ name: string; description: string }>;
  outputs: Record<string, unknown> | null;
  source: 'initial' | 'refresh' | 'analysis-update';
}

export interface ModelContextEvent {
  formId: string;
  modelId?: string | null;
  data: SerializedContext;
  contextLabel?: string | null;
}

export interface ModelSubmitEvent {
  formId: string;
  data: SerializedContext;
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
}

export interface ModelErrorEvent {
  formId: string;
  errors: Array<{ path: string; message: string }>;
}

export interface AppEventMap extends EventMap {
  'chat:context': ChatContextEvent;
  'chat:state': ChatStateEvent;
  'chat:tools:update': ChatToolsUpdateEvent;
  'model:context': ModelContextEvent;
  'model:submit': ModelSubmitEvent;
  'model:error': ModelErrorEvent;
}

export const appEventBus = getOrCreateGlobalBus<AppEventMap>(() => createEventBus<AppEventMap>());
