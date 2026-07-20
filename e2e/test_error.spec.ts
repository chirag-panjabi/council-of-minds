import { test, expect } from '@playwright/test';

test('reproduce error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
    errors.push(`Page Error: ${error.message}`);
  });
  page.on('console', msg => {
    console.log(`Console: ${msg.type()} - ${msg.text()}`);
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem('framework-engine:onboarding', JSON.stringify({
      hasCompletedSetup: false,
      hasSkippedSetup: true
    }));
  });

  await page.goto('/');
  
  await page.click('text="Start 1-on-1"');
  await page.waitForTimeout(1000);
  
  // wait for the persona list
  await page.waitForSelector('text="General Assistant"', { timeout: 5000 }).catch(e => console.log('Timeout waiting for General Assistant'));
  
  const hasButton = await page.$('button:has(h4)');
  if (hasButton) {
    console.log('Found button, clicking...');
    await page.click('button:has(h4)');
    await page.waitForTimeout(2000);
  } else {
    console.log('Button not found! HTML:');
    const html = await page.content();
    console.log(html);
  }
  
  if (errors.length > 0) {
    throw new Error('Errors found:\n' + errors.join('\n'));
  }
});
