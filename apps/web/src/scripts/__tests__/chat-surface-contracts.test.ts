import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('chat surface contracts', () => {
  it('keeps the global chat disabled on non-work surfaces', () => {
    const pagePaths = [
      'src/pages/index.astro',
      'src/pages/models.astro',
      'src/pages/models/personal.astro',
      'src/pages/models/business.astro',
      'src/pages/journey.astro',
      'src/pages/journey/[scenario].astro',
      'src/pages/agent.astro',
    ];

    pagePaths.forEach((pagePath) => {
      expect(readSource(pagePath)).toContain('showChat={false}');
    });
  });

  it('keeps the dedicated agent workspace mounted on the agent page', () => {
    const agentPage = readSource('src/pages/agent.astro');

    expect(agentPage).toContain('showChat={false}');
    expect(agentPage).toContain('<AgentChatPanel client:only="react" />');
  });

  it('keeps global and embedded chat labeled as different products', () => {
    const chatPanel = readSource('src/components/ChatPanel.astro');

    expect(chatPanel).toContain("{isEmbedded ? 'Guided analysis' : 'Site guide'}");
    expect(chatPanel).toContain('title="Open site guide"');
    expect(chatPanel).toContain('placeholder={isEmbedded ?');
  });
});
