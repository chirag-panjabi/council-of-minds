import { test, expect } from '@playwright/test';

test('a new browser session opens onboarding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.locator('h1')).toHaveText('Choose how Framework Engine reaches a model');
});

test('cloud validation uses the same-origin proxy and saves only after success', async ({ page }) => {
  let validationRequests = 0;
  await page.route('**/api/proxy/openai/validate', async (route) => {
    validationRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'valid', retryable: false }),
    });
  });

  await page.goto('/onboarding');
  await page.getByRole('textbox', { name: 'API key' }).fill('key-for-playwright-only');
  await page.getByRole('button', { name: 'Validate and save' }).click();

  await expect(page).toHaveURL(/\/$/);
  expect(validationRequests).toBe(1);
  await expect(page.getByRole('heading', { name: 'Think with a council of perspectives.' })).toBeVisible();
});

test('Ollama discovery is a direct browser-to-loopback request', async ({ page }) => {
  let directRequests = 0;
  let proxyRequests = 0;
  await page.route('**://localhost:11434/api/tags', async (route) => {
    directRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': 'http://localhost:3000' },
      body: JSON.stringify({ models: [{ name: 'qwen3:latest', model: 'qwen3:latest' }] }),
    });
  });
  await page.route('**/api/proxy/**', async (route) => {
    proxyRequests += 1;
    await route.abort();
  });

  await page.goto('/onboarding');
  await page.getByRole('radio', { name: 'Ollama (local)' }).check();
  await page.getByRole('button', { name: 'Test connection' }).click();

  await expect(page).toHaveURL(/\/$/);
  expect(directRequests).toBe(1);
  expect(proxyRequests).toBe(0);
});
