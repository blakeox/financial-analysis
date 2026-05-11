import React, { useCallback, useMemo, useState } from 'react';
import { useHydrated, useAutoScroll, useEscapeKey } from '../lib/hooks';
import {
  buttonBaseClasses,
  buttonVariants,
  cardVariants,
  cn,
  inputClasses,
  textColors,
} from '../lib/classNames';
import { Button } from './Button';

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
        className={cn(
          'fixed right-6 bottom-6 z-100 h-14 w-14 rounded-full px-0 shadow-[0_22px_48px_rgba(109,74,255,0.34)]',
          buttonBaseClasses,
          buttonVariants.primary
        )}
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
            className={cn(
              cardVariants.rail,
              'fixed top-0 right-0 z-90 h-full w-full rounded-none border-y-0 border-r-0 p-0 shadow-2xl transition-transform duration-200 ease-in-out will-change-transform-opacity gpu translate-x-0 sm:w-[380px] md:w-[420px]'
            )}
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-3 sm:px-4 dark:border-slate-800">
              <div className={cn('flex items-center gap-2 text-sm font-semibold', textColors.primary)}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-violet-700 text-white shadow-[0_10px_24px_rgba(109,74,255,0.24)]">
                  AI
                </span>
                <span>{title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-xl px-0"
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
                </Button>
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
                    className={cn('text-sm', m.role === 'user' ? textColors.primary : textColors.secondary)}
                  >
                  <div
                      className={cn(
                        'inline-block max-w-[90%] whitespace-pre-wrap break-words rounded-2xl border px-4 py-3 shadow-sm',
                        m.role === 'user'
                          ? 'border-violet-300/70 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/45 dark:text-violet-50'
                          : cn(cardVariants.subtle, 'px-4 py-3')
                      )}
                    >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && <div className={cn('text-xs', textColors.muted)}>Thinking…</div>}
            </div>

            {/* Composer */}
            <div className="flex items-center gap-2 border-t border-slate-200/80 px-3 py-3 sm:px-4 dark:border-slate-800">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={busy ? 'Please wait…' : 'Type a message (⌘/Ctrl+Enter to send)'}
                className={cn(
                  inputClasses,
                  'h-11 min-h-11 flex-1 resize-none py-2.5 leading-5'
                )}
                disabled={busy}
              />
              <Button
                type="button"
                onClick={onSend}
                disabled={busy || !input.trim()}
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ChatPanel;
