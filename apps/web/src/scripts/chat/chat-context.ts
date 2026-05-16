import {
  appEventBus,
  type ChatContextEvent,
  type SerializedContext,
} from '@financial-analysis/tools';

export type ChatContextPayload = {
  contextKey?: string | null;
  label?: string | null;
  data?: SerializedContext | null;
};

const CHAT_CONTEXT_EVENT = 'chat-panel-context';

const isBrowser = (): boolean => typeof window !== 'undefined';

export function publishChatContext(
  contextKey: string | null,
  label: string | null,
  data: SerializedContext | null = null,
  source: ChatContextEvent['source'] = 'chat'
): void {
  if (!isBrowser()) {
    return;
  }

  const payload: ChatContextEvent = {
    contextKey,
    label,
    data,
    source,
  };

  appEventBus.emit('chat:context', payload);

  // Legacy DOM event for existing listeners (gradual migration)
  const detail: ChatContextPayload = { contextKey, label, data };
  window.dispatchEvent(new CustomEvent<ChatContextPayload>(CHAT_CONTEXT_EVENT, { detail }));

  const win = window as Window & {
    updateChatContext?: (label: string | null, data: unknown) => void;
    __chatContextBridge__?: (label: string | null, data: unknown) => void;
    __legacyChatContextEventBridgeInstalled__?: boolean;
  };

  const legacyUpdater = win.updateChatContext;

  if (typeof legacyUpdater === 'function' && legacyUpdater !== win.__chatContextBridge__) {
    try {
      legacyUpdater(label, data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[chat-context] Legacy updateChatContext invocation failed', error);
      }
    }
  }
}

export function subscribeChatContext(
  callback: (payload: ChatContextPayload & { source?: ChatContextEvent['source'] }) => void
): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  return appEventBus.on('chat:context', ({ contextKey, label, data, source }) => {
    callback({ contextKey, label, data, source });
  });
}

export function installChatContextBridge(): void {
  if (!isBrowser()) {
    return;
  }

  const win = window as Window & {
    updateChatContext?: (label: string | null, data: unknown) => void;
    __chatContextBridge__?: (label: string | null, data: unknown) => void;
    __legacyChatContextEventBridgeInstalled__?: boolean;
  };

  const bridge = (label: string | null, data: unknown) => {
    const serialized =
      data && typeof data === 'object'
        ? (data as SerializedContext)
        : (data as SerializedContext | null);
    publishChatContext(null, label, serialized, 'legacy');
  };

  // Avoid overriding if the bridge is already installed
  if (win.updateChatContext === bridge) {
    if (win.__legacyChatContextEventBridgeInstalled__) {
      return;
    }
  }

  win.updateChatContext = bridge;
  win.__chatContextBridge__ = bridge;

  if (!win.__legacyChatContextEventBridgeInstalled__) {
    window.addEventListener('chat-context-update', (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const detail = event.detail as
        | {
            context?: string | null;
            contextKey?: string | null;
            label?: string | null;
            contextLabel?: string | null;
            data?: SerializedContext | null;
            contextData?: SerializedContext | null;
          }
        | undefined;

      const contextKey = detail?.contextKey ?? detail?.context ?? null;
      const label = detail?.label ?? detail?.contextLabel ?? null;
      const data = detail?.data ?? detail?.contextData ?? null;

      publishChatContext(contextKey, label, data, 'legacy');
    });
    win.__legacyChatContextEventBridgeInstalled__ = true;
  }
}

export { CHAT_CONTEXT_EVENT };
