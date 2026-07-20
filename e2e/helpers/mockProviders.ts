import { Page } from '@playwright/test';

/**
 * Mocks the provider endpoints (e.g. OpenAI, Anthropic) to prevent actual network calls
 * and simulate streaming or simple JSON responses.
 */
export async function mockProviderResponse(
  page: Page,
  providerPath: string,
  mockResponse: any,
  status = 200,
) {
  await page.route(`**/api/providers/${providerPath}`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    });
  });
}

/**
 * Example usage:
 * await mockProviderResponse(page, 'openai/chat', { choices: [{ message: { content: 'Mock response' } }] });
 */
