/**
 * Makes `.scenario-card` tiles keyboard-operable when rendered as non-link surfaces.
 * Complements click handlers in multi-model-scenarios / analysis flows.
 */

const ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);

function labelForCard(card: HTMLElement): string {
  const titled = card.querySelector<HTMLElement>('h2, h3, h4, .fa-scenario-title, .fa-model-title');
  const text = titled?.textContent?.trim();
  if (text) return `Open ${text}`;
  const scenarioId = card.getAttribute('data-scenario') ?? card.getAttribute('data-model');
  if (scenarioId) return `Open ${scenarioId.replace(/-/g, ' ')}`;
  return 'Open scenario';
}

function activateCard(card: HTMLElement): void {
  card.click();
}

function enhanceScenarioCard(card: HTMLElement): void {
  if (card.classList.contains('model-card')) return;
  if (card.dataset.a11yEnhanced === 'true') return;
  if (card.closest('a[href]')) return;

  const tag = card.tagName.toLowerCase();
  if (tag === 'a' || tag === 'button') return;

  card.dataset.a11yEnhanced = 'true';
  if (!card.hasAttribute('role')) {
    card.setAttribute('role', 'button');
  }
  if (!card.hasAttribute('tabindex')) {
    card.setAttribute('tabindex', '0');
  }
  if (!card.hasAttribute('aria-label')) {
    card.setAttribute('aria-label', labelForCard(card));
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (!ACTIVATION_KEYS.has(event.key)) return;
  const card = (event.target as HTMLElement | null)?.closest<HTMLElement>('.scenario-card');
  if (!card || card.dataset.a11yEnhanced !== 'true') return;
  event.preventDefault();
  activateCard(card);
}

export function enhanceInteractiveScenarioCards(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.scenario-card').forEach(enhanceScenarioCard);
}

if (typeof window !== 'undefined') {
  const run = () => enhanceInteractiveScenarioCards();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('scenario-cards-updated', run);
}
