import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  testDir: './tests/family/browser',
  timeout: 60000,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'output/phase4/browser-results.json' }]],
  outputDir: join(tmpdir(), 'familyconnect-playwright-phase4'),
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1600, height: 1200 },
    headless: true,
  },
  webServer: {
    command: 'npm run dev:family',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
