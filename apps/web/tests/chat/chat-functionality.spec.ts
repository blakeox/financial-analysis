import { expect, test, type Page } from '@playwright/test';

async function gotoCalculator(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

async function expectEmbeddedChatShell(page: Page): Promise<void> {
  const panel = page.locator('#chat-panel[data-chat-variant="embedded"]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('role', 'region');
  await expect(panel).toHaveAttribute('aria-hidden', 'false');

  await expect(page.locator('#chat-toggle')).toHaveCount(0);
  await expect(page.locator('#chat-close')).toHaveCount(0);
  await expect(page.locator('#chat-send')).toBeDisabled();
  await expect(page.locator('#chat-char-counter')).toContainText('0/2000');
  await expect(page.locator('.system-message')).toContainText(
    /run the numbers once to unlock result-aware guidance/i
  );
}

test.describe('Embedded calculator chat contracts', () => {
  test('renders the embedded chat shell on calculator routes', async ({ page }) => {
    await gotoCalculator(page, '/calculator/pricing-strategy');
    await expectEmbeddedChatShell(page);
  });

  test('shows context-specific labels on representative calculator pages', async ({ page }) => {
    const cases = [
      { path: '/calculator/pricing-strategy', label: /Pricing Strategy/i },
      { path: '/calculator/amortization', label: /Mortgage|Loan/i },
      { path: '/calculator/auto-loan', label: /Auto Loan/i },
    ];

    for (const { path, label } of cases) {
      await gotoCalculator(page, path);
      await expectEmbeddedChatShell(page);
      await expect(page.locator('#context-indicator')).toContainText(label);
    }
  });

  test('keeps legacy and canonical amortization routes on the same embedded chat context', async ({
    page,
  }) => {
    await gotoCalculator(page, '/amortization');
    await expectEmbeddedChatShell(page);
    await expect(page.locator('#context-indicator')).toContainText(/Mortgage|Loan/i);

    await gotoCalculator(page, '/calculator/amortization');
    await expectEmbeddedChatShell(page);
    await expect(page.locator('#context-indicator')).toContainText(/Mortgage|Loan/i);
  });

  test('enables sending and updates the character counter in the embedded panel', async ({
    page,
  }) => {
    await gotoCalculator(page, '/calculator/pricing-strategy');
    await expectEmbeddedChatShell(page);

    const input = page.locator('#chat-input');
    const sendButton = page.locator('#chat-send');
    const counter = page.locator('#chat-char-counter');

    await input.fill('Test message');

    await expect(sendButton).toBeEnabled();
    await expect(counter).toContainText('12/2000');
  });
});
