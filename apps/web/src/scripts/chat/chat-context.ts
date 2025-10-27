export type ChatContextPayload = {
  contextKey?: string | null;
  label?: string | null;
  data?: unknown;
};

const CHAT_CONTEXT_EVENT = 'chat-panel-context';

const isBrowser = (): boolean => typeof window !== 'undefined';

export function publishChatContext(
  contextKey: string | null,
  label: string | null,
  data: unknown = null
): void {
  if (!isBrowser()) {
    return;
  }

  const detail: ChatContextPayload = { contextKey, label, data };
  window.dispatchEvent(new CustomEvent<ChatContextPayload>(CHAT_CONTEXT_EVENT, { detail }));

  const win = window as Window & {
    updateChatContext?: (label: string | null, data: unknown) => void;
    __chatContextBridge__?: (label: string | null, data: unknown) => void;
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
  callback: (payload: ChatContextPayload) => void
): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<ChatContextPayload>;
    callback(custom.detail ?? { contextKey: null, label: null, data: null });
  };

  window.addEventListener(CHAT_CONTEXT_EVENT, handler as EventListener);
  return () => window.removeEventListener(CHAT_CONTEXT_EVENT, handler as EventListener);
}

export function installChatContextBridge(): void {
  if (!isBrowser()) {
    return;
  }

  const win = window as Window & {
    updateChatContext?: (label: string | null, data: unknown) => void;
    __chatContextBridge__?: (label: string | null, data: unknown) => void;
  };

  const bridge = (label: string | null, data: unknown) => {
    publishChatContext(null, label, data);
  };

  // Avoid overriding if the bridge is already installed
  if (win.updateChatContext === bridge) {
    return;
  }

  win.updateChatContext = bridge;
  win.__chatContextBridge__ = bridge;
}

export { CHAT_CONTEXT_EVENT };
