import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const listeners = new Map<string, Set<(payload: unknown) => void>>();

vi.mock('@financial-analysis/tools', () => ({
  appEventBus: {
    emit(event: string, payload: unknown) {
      listeners.get(event)?.forEach((listener) => listener(payload));
    },
    on(event: string, listener: (payload: unknown) => void) {
      const registered = listeners.get(event) ?? new Set<(payload: unknown) => void>();
      registered.add(listener);
      listeners.set(event, registered);
      return () => {
        registered.delete(listener);
      };
    },
  },
}));

let CHAT_CONTEXT_EVENT: string;
let installChatContextBridge: typeof import('../chat/chat-context').installChatContextBridge;
let publishChatContext: typeof import('../chat/chat-context').publishChatContext;
let subscribeChatContext: typeof import('../chat/chat-context').subscribeChatContext;

beforeAll(async () => {
  const module = await import('../chat/chat-context');
  CHAT_CONTEXT_EVENT = module.CHAT_CONTEXT_EVENT;
  installChatContextBridge = module.installChatContextBridge;
  publishChatContext = module.publishChatContext;
  subscribeChatContext = module.subscribeChatContext;
});

describe('chat context bridge', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    listeners.clear();
    vi.restoreAllMocks();
  });

  it('publishes the shared event bus payload and legacy DOM event together', () => {
    const busPayloads: Array<Record<string, unknown>> = [];
    const domHandler = vi.fn();
    const unsubscribe = subscribeChatContext((payload) => {
      busPayloads.push(payload as Record<string, unknown>);
    });

    window.addEventListener(CHAT_CONTEXT_EVENT, domHandler);

    publishChatContext('retirement', 'Retirement Calculator', { currentAge: '35' }, 'chat');

    unsubscribe();
    window.removeEventListener(CHAT_CONTEXT_EVENT, domHandler);

    expect(busPayloads).toEqual([
      {
        contextKey: 'retirement',
        label: 'Retirement Calculator',
        data: { currentAge: '35' },
        source: 'chat',
      },
    ]);
    expect(domHandler).toHaveBeenCalledTimes(1);
    expect((domHandler.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      contextKey: 'retirement',
      label: 'Retirement Calculator',
      data: { currentAge: '35' },
    });
  });

  it('bridges legacy chat-context-update events into the shared context contract', () => {
    installChatContextBridge();

    const payloads: Array<Record<string, unknown>> = [];
    const unsubscribe = subscribeChatContext((payload) => {
      payloads.push(payload as Record<string, unknown>);
    });

    window.dispatchEvent(
      new CustomEvent('chat-context-update', {
        detail: {
          context: 'mortgage-scenario-planning',
          contextLabel: 'Scenario Planner',
          contextData: { targetPayment: '2400' },
        },
      })
    );

    unsubscribe();

    expect(payloads).toEqual([
      {
        contextKey: 'mortgage-scenario-planning',
        label: 'Scenario Planner',
        data: { targetPayment: '2400' },
        source: 'legacy',
      },
    ]);
  });
});
