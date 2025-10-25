type ChatWindow = Window & {
  toggleChatPanel?: () => void;
  updateChatContext?: (label: string | null, data: Record<string, unknown> | null) => void;
};

type ChatData = Record<string, unknown> | undefined;

type ReadyCallback = () => void;

const chatWindow = window as ChatWindow;

const onDocumentReady = (callback: ReadyCallback): void => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

export const openChatWithContext = (label: string, data?: Record<string, unknown>): void => {
  if (chatWindow.toggleChatPanel) {
    chatWindow.toggleChatPanel();
  }

  if (chatWindow.updateChatContext) {
    chatWindow.updateChatContext(label, data ?? null);
  }
};

export const registerChatButton = (
  target: string | HTMLButtonElement | null,
  label: string,
  data?: ChatData,
): void => {
  onDocumentReady(() => {
    const button =
      typeof target === 'string'
        ? document.querySelector<HTMLButtonElement>(target)
        : target instanceof HTMLButtonElement
          ? target
          : null;

    if (!button) {
      return;
    }

    if (button.dataset.chatBound === 'true') {
      return;
    }

    button.dataset.chatBound = 'true';

    if (button.type !== 'button') {
      button.type = 'button';
    }

    button.addEventListener('click', (event: Event) => {
      event.preventDefault();
      openChatWithContext(label, data);
    });
  });
};
