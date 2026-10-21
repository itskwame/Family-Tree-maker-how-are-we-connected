import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Independent cache avoids interfering with an existing Vite development session.
export default defineConfig({
  plugins: [react()],
  define:{__FAMILYCONNECT_DEMO__:'true',__FAMILYCONNECT_ENV__:JSON.stringify('local-demo'),__FAMILYCONNECT_CONFIG__:'null'},
  worker: { format: 'es' },
  // Keep ephemeral dependency optimization outside OneDrive's synced tree.
  cacheDir: join(tmpdir(), 'familyconnect-vite-' + createHash('sha256').update(process.cwd()).digest('hex').slice(0, 10)),
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: { outDir: 'dist-family-prototype' },
});
