const TOP_OFFSET_VARIABLE = '--chat-panel-top-offset';
const ACTIVE_WIDTH_VARIABLE = '--chat-panel-active-width';
const BODY_OPEN_CLASS = 'chat-panel-open';

export const MIN_CONTENT_WIDTH = 640;

export function syncChatAriaState(
  toggle: HTMLButtonElement,
  panel: HTMLDivElement,
  isOpen: boolean
): void {
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  toggle.setAttribute('aria-label', isOpen ? 'Close AI assistant' : 'Open AI assistant');
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

export function setTopOffset(offset: number): void {
  document.documentElement.style.setProperty(TOP_OFFSET_VARIABLE, `${offset}px`);
}

export function updateActiveWidth(panelWidth: number, windowWidth: number): boolean {
  const shouldOffset = windowWidth - panelWidth >= MIN_CONTENT_WIDTH;
  document.documentElement.style.setProperty(
    ACTIVE_WIDTH_VARIABLE,
    shouldOffset ? `${panelWidth}px` : '0px'
  );
  document.body.classList.toggle(BODY_OPEN_CLASS, shouldOffset);
  return shouldOffset;
}

export function clearActiveWidth(): void {
  document.documentElement.style.setProperty(ACTIVE_WIDTH_VARIABLE, '0px');
  document.body.classList.remove(BODY_OPEN_CLASS);
}
