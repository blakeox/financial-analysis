import React, { useCallback, useMemo, useState } from 'react';
import { useHydrated, useAutoScroll, useEscapeKey } from '../lib/hooks';
import { cn } from '../lib/classNames';

type Role = 'system' | 'user' | 'assistant';
type Message = { role: Role; content: string };

export interface ChatPanelProps {
  apiUrl?: string; // Base URL for API (defaults to '')
  title?: string;
  initialOpen?: boolean;
}

export function ChatPanel({
  apiUrl = '',
  title = 'Assistant',
  initialOpen = false,
}: ChatPanelProps) {
  const [open, setOpen] = useState(initialOpen);
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! Ask me about lease or amortization calculations.' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useAutoScroll<HTMLDivElement>([messages, open]);

  // Don't render until hydrated to prevent SSR/client mismatch
  if (!hydrated) {
    return null;
  }

  const chatEndpoint = useMemo(() => {
    // Accept absolute or relative. If not provided, default to same-origin /v1/chat
    const base = apiUrl?.trim();
    if (!base) return '/v1/chat';
    // If base already looks like a path or absolute URL, append if needed.
    return base.endsWith('/v1/chat') ? base : base.replace(/\/$/, '') + '/v1/chat';
  }, [apiUrl]);

  const onSend = useCallback(async () => {
    const content = input.trim();
    if (!content || busy) return;
    const nextMessages = [...messages, { role: 'user' as Role, content }];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Error');
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: `Request failed (${res.status}): ${text}` },
        ]);
      } else {
        const data = (await res.json()) as { role?: Role; content?: string };
        const reply: Message = { role: data.role ?? 'assistant', content: data.content ?? '' };
        setMessages((m) => [...m, reply]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, [busy, chatEndpoint, input, messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend();
    }
  };

  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);

  // Close on Esc when panel is open
  useEscapeKey(closePanel, open);

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-label="Open chat assistant"
        data-hydrated={hydrated ? 'true' : 'false'}
        data-z-fallback="80"
        className="fixed bottom-6 right-6 z-100 inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
        </svg>
      </button>

      {/* Scrim + Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-60 bg-black/40 transition-opacity will-change-transform-opacity gpu opacity-100"
            aria-hidden="true"
            data-testid="chat-scrim"
            onClick={closePanel}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chat assistant"
            data-z-fallback="90"
            className="fixed z-90 top-0 right-0 h-full w-full sm:w-[380px] md:w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-200 ease-in-out will-change-transform-opacity gpu translate-x-0"
          >
            {/* Header */}
            <div className="h-14 px-3 sm:px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white">
                  AI
                </span>
                <span>{title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="h-[calc(100%-7rem)] overflow-y-auto px-3 sm:px-4 py-3 space-y-3"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'text-sm',
                    m.role === 'user'
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-800 dark:text-gray-200'
                  )}
                >
                  <div
                    className={cn(
                      'inline-block max-w-[90%] whitespace-pre-wrap break-words rounded-lg px-3 py-2',
                      m.role === 'user'
                        ? 'bg-blue-50 dark:bg-blue-400/10 border border-blue-200/60 dark:border-blue-700/40'
                        : 'bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && <div className="text-xs text-gray-500">Thinking…</div>}
            </div>

            {/* Composer */}
            <div className="h-14 px-3 sm:px-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={busy ? 'Please wait…' : 'Type a message (⌘/Ctrl+Enter to send)'}
                className="flex-1 resize-none h-10 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                disabled={busy}
              />
              <button
                type="button"
                onClick={onSend}
                disabled={busy || !input.trim()}
                className="inline-flex h-10 px-3 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ChatPanel;
