import { expect, test } from '@playwright/test';

type ChatRequestBody = {
  messages?: Array<{ role: string; content: string }>;
};

test.describe('ChatPanel send flow', () => {
  test('mocks /v1/chat, sends message, and renders amortization analysis', async ({ page }) => {
    await page.goto('/');

    // Intercept chat endpoint
    await page.route('**/v1/chat', async (route) => {
      const requestBody = route.request().postDataJSON() as ChatRequestBody;
      // Basic shape check
      expect(Array.isArray(requestBody?.messages)).toBeTruthy();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'assistant',
          content: 'Here is your amortization summary.',
          analysis: {
            kind: 'amortization',
            result: {
              monthlyPayment: 536.82,
              totalPayments: 193255.2,
              totalInterest: 93255.2,
              schedule: Array.from({ length: 360 }, (_, i) => {
                const month = i + 1;
                return {
                  month,
                  payment: 536.82,
                  principal: month === 1 ? 120 : 121,
                  interest: month === 1 ? 416.82 : 415.82,
                  balance: Math.max(0, 200000 - month * 120),
                };
              }),
            },
          },
        }),
      });
    });

    // Open launcher
    const launcher = page.getByRole('button', { name: /chat/i });
    await expect(launcher).toBeVisible();
    await launcher.click();

    const panel = page.getByRole('dialog', { name: /chat assistant/i });
    await expect(panel).toBeVisible();

    // Type and send message
    const composer = panel.getByPlaceholder(/type a message/i);
    await composer.fill('Show me amortization');
    await panel.getByRole('button', { name: /^send$/i }).click();

    // Assistant message appears
    await expect(panel.getByText('Here is your amortization summary.')).toBeVisible();

    // AmortizationResults in chat: check key labels to confirm render
    await expect(panel.getByText(/Monthly payment/i)).toBeVisible();
    await expect(panel.getByText(/Total interest/i)).toBeVisible();
    await expect(panel.getByText(/Total paid/i)).toBeVisible();

    // Chart title rendered from ChatPanel usage
    await expect(panel.getByText(/Amortization breakdown/i)).toBeVisible();

    // Close panel to ensure no lingering overlay blocks the page
    const scrim = page.getByTestId('chat-scrim');
    if (await scrim.count()) {
      await scrim.click({ position: { x: 10, y: 10 } });
    } else {
      await panel.getByRole('button', { name: /close/i }).click();
    }
    await expect(panel).toBeHidden();
  });
});
