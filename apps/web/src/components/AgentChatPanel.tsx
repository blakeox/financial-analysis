import { useAgent } from 'agents/react';
import { useAgentChat } from '@cloudflare/ai-chat/react';
import { useMemo, useState } from 'react';

const SESSION_STORAGE_KEY = 'fanalyx-project-think-session';

const STARTER_PROMPTS = [
  'Run an amortization analysis for a $320,000 loan at 6.25% over 360 months.',
  'Analyze a lease for $28,000 at 5.9% for 36 months with a $12,000 residual value.',
  'What financial workflows can you help with right now?',
] as const;

function getOrCreateSessionName(): string {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = `fanalyx-${crypto.randomUUID()}`;
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

function getMessageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

export function AgentChatPanel() {
  const [input, setInput] = useState('');
  const sessionName = useMemo(() => getOrCreateSessionName(), []);
  const agent = useAgent({
    agent: 'FinancialAnalysisAgent',
    name: sessionName,
  });
  const { messages, sendMessage, status } = useAgentChat({ agent });

  const submitMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    sendMessage({ text: trimmed });
    setInput('');
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Fanalyx Agent</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Powered by Cloudflare Project Think with persistent agent sessions and deterministic
              finance tools.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {status === 'streaming' ? 'Streaming response' : 'Ready'}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-950"
              onClick={() => submitMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[32rem] space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Ask for an amortization or lease analysis. The agent keeps its conversation state in a
            Cloudflare Durable Object-backed session so it can remember the thread.
          </div>
        ) : null}

        {messages.map((message) => {
          const text = getMessageText(message);
          return (
            <div
              key={message.id}
              className={`max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                {message.role === 'user' ? 'You' : 'Agent'}
              </p>
              <p className="whitespace-pre-wrap leading-6">
                {text || 'This response contained structured tool data.'}
              </p>
            </div>
          );
        })}
      </div>

      <form
        className="border-t border-slate-200 px-6 py-5 dark:border-slate-800"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(input);
        }}
      >
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Message
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for a payment schedule, lease summary, or the workflows this agent supports."
            className="min-h-28 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <button
            type="submit"
            disabled={status === 'streaming' || input.trim().length === 0}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'streaming' ? 'Working…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AgentChatPanel;
