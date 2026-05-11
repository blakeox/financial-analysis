import { useAgent } from 'agents/react';
import { useAgentChat } from '@cloudflare/ai-chat/react';
import { useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, cn, inputClasses } from '@financial-analysis/ui';

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
    <Card variant="rail">
      <CardHeader className="fa-panel-divider px-6 py-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">Fanalyx Agent</CardTitle>
            <p className="fa-card-copy fa-card-copy-sm !mt-0">
              Powered by Cloudflare Project Think with persistent agent sessions and deterministic
              finance tools.
            </p>
          </div>
          <div className="fa-chip fa-chip-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {status === 'streaming' ? 'Streaming response' : 'Ready'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="fa-panel-divider px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto rounded-full px-3 py-2 text-left"
              onClick={() => submitMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </CardContent>

      <CardContent className="max-h-[32rem] space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="fa-subcard border-dashed text-sm">
            Ask for an amortization or lease analysis. The agent keeps its conversation state in a
            Cloudflare Durable Object-backed session so it can remember the thread.
          </div>
        ) : null}

        {messages.map((message) => {
          const text = getMessageText(message);
          return (
            <div
              key={message.id}
              className={`max-w-3xl rounded-[1.35rem] border px-4 py-3 text-sm shadow-sm ${
                message.role === 'user'
                  ? 'ml-auto border-violet-300/70 bg-violet-600 text-white dark:border-violet-800 dark:bg-violet-600'
                  : 'fa-subcard'
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
      </CardContent>

      <form
        className="fa-panel-divider-top px-6 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(input);
        }}
      >
        <label className="fa-field-label mb-2">
          Message
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for a payment schedule, lease summary, or the workflows this agent supports."
            className={cn(inputClasses, 'min-h-28 flex-1 py-3')}
          />
          <Button
            type="submit"
            disabled={status === 'streaming' || input.trim().length === 0}
            className="min-w-[120px] self-start md:self-auto"
          >
            {status === 'streaming' ? 'Working…' : 'Send'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default AgentChatPanel;
