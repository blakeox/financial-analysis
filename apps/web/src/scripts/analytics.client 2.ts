import { monitoredFetch, trackError, trackUserAction } from '@financial-analysis/ui';
import { appEventBus } from '@financial-analysis/tools';

type ButtonIds = 'test-api-call' | 'test-error' | 'test-action';

const getButton = (id: ButtonIds) => {
  const element = document.getElementById(id);
  return element instanceof HTMLButtonElement ? element : null;
};

const initAnalyticsTestControls = () => {
  appEventBus.on('model:context', (event) => {
    trackUserAction({
      action: 'model_context_update',
      element: 'event-bus',
      value: event.modelId ?? event.contextLabel ?? 'unknown-model',
      context: event.data,
    });
  });

  const apiButton = getButton('test-api-call');
  const errorButton = getButton('test-error');
  const actionButton = getButton('test-action');

  apiButton?.addEventListener('click', async () => {
    try {
      await monitoredFetch('/health');
      window.alert('✅ API call tracked! Check dashboard above.');
    } catch (error) {
      console.error('API call failed:', error);
    }
  });

  errorButton?.addEventListener('click', () => {
    const error = new Error('This is a test error for analytics tracking');
    trackError(error, {
      source: 'test-button',
      userAction: 'intentional-test',
      timestamp: Date.now(),
    });
    window.alert('❌ Error tracked! Check dashboard above.');
  });

  actionButton?.addEventListener('click', () => {
    trackUserAction({
      action: 'test_button_click',
      element: 'test-action-button',
      value: 'user-action-test',
      context: { test: true, timestamp: Date.now() },
    });
    window.alert('👆 User action tracked! Check dashboard above.');
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalyticsTestControls, { once: true });
} else {
  initAnalyticsTestControls();
}

export {};
