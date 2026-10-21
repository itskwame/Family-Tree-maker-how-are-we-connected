import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({
  testDir: './tests/family/production', timeout: 60000, workers: 1,
  outputDir: join(tmpdir(), 'familyconnect-production-test'),
  reporter: [['list'], ['json', { outputFile: 'output/phase4/production-results.json' }]],
  use: { channel: 'chrome', headless: true, baseURL: 'http://127.0.0.1:5175', viewport: { width: 1600, height: 1200 } },
  webServer: { command: 'npx vite preview --config vite.prototype.config.mjs --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: false },
});
