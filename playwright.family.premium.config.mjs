import base from './playwright.family.config.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default { ...base, testDir: './tests/family/premium', timeout: 180000,
  outputDir: join(tmpdir(), 'familyconnect-premium'),
  reporter: [['list'], ['json', { outputFile: 'output/phase5/browser-results.json' }]],
};
