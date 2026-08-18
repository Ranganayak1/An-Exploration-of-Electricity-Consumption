/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  timeout: 30000,
  use: {
    headless: true,
    baseURL: 'http://localhost:3001',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
};
