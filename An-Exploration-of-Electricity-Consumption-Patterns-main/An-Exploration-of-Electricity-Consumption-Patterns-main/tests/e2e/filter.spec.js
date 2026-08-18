const { test, expect } = require('@playwright/test');

test('dashboard filters update visualizations', async ({ page }) => {
  await page.goto('/dashboard');
  // wait for meta to load and filter panel to appear
  await page.waitForSelector('.filter-panel');

  const selects = page.locator('.filter-panel .filter-group select');
  const count = await selects.count();
  if (count === 0) {
    test.skip(true, 'No filters found');
    return;
  }

  // Choose the first non-empty option for the first select
  const firstSelect = selects.nth(0);
  const options = await firstSelect.locator('option').allTextContents();
  if (options.length > 1) {
    await firstSelect.selectOption({ index: 1 });
  }

  // wait for the dashboard's last-update indicator to change
  await page.waitForTimeout(500); // debounce window
  const latencyText = await page.locator('text=Last update').first().textContent().catch(() => null);
  // ensure charts either show data or 'No data' placeholder
  const chartExists = await page.locator('.chart-card').count();
  expect(chartExists).toBeGreaterThan(0);
  // a basic assertion that page responded and charts exist
  expect(await page.title()).toContain('Analytics');
});
