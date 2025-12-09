import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openChatWithContext, registerChatButton } from '../chat/chat-actions';

declare global {
  interface Window {
    toggleChatPanel?: () => void;
  }
}

describe('chat-actions', () => {
  const captureContext = () => {
    const contexts: Array<{ label: string | null; data: Record<string, unknown> | null }> = [];
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ label?: string | null; data?: Record<string, unknown> | null }>).detail;
      contexts.push({ label: detail?.label ?? null, data: (detail?.data ?? null) as Record<string, unknown> | null });
    };
    window.addEventListener('chat-panel-context', listener as EventListener);
    return {
      contexts,
      dispose: () => window.removeEventListener('chat-panel-context', listener as EventListener),
    };
  };

  beforeEach(() => {
    vi.resetAllMocks();
    document.body.innerHTML = '';
    delete window.toggleChatPanel;
  });

  it('opens chat with provided context when handlers exist', () => {
    const toggleSpy = vi.fn();
    window.toggleChatPanel = toggleSpy;
    const recorder = captureContext();

    openChatWithContext('Lease Analysis', { principal: 1000 });

    expect(toggleSpy).toHaveBeenCalledOnce();
    expect(recorder.contexts.at(-1)).toEqual({ label: 'Lease Analysis', data: { principal: 1000 } });
    recorder.dispose();
  });

  it('registerChatButton binds click handler to open chat', async () => {
    const button = document.createElement('button');
    button.id = 'chat-test';
    document.body.appendChild(button);

    const toggleSpy = vi.fn();
    window.toggleChatPanel = toggleSpy;
    const recorder = captureContext();

    registerChatButton('#chat-test', 'Debt Payoff', { balance: 5000 });

    button.click();

    expect(toggleSpy).toHaveBeenCalledOnce();
    expect(recorder.contexts.at(-1)).toEqual({ label: 'Debt Payoff', data: { balance: 5000 } });
    expect(button.dataset.chatBound).toBe('true');
    expect(button.type).toBe('button');
    recorder.dispose();
  });

  it('avoids duplicate bindings when button already processed', () => {
    const button = document.createElement('button');
    button.id = 'duplicate-chat';
    document.body.appendChild(button);

    const toggleSpy = vi.fn();
    window.toggleChatPanel = toggleSpy;

    registerChatButton('#duplicate-chat', 'Lease');
    registerChatButton('#duplicate-chat', 'Lease');

    button.click();

    expect(toggleSpy).toHaveBeenCalledOnce();
  });
});
