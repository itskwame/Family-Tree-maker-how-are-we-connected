import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({plugins:[react()],envPrefix:'VITE_PHASE6_',cacheDir:join(tmpdir(),'familyconnect-phase6-vite'),worker:{format:'es'},server:{host:'127.0.0.1',port:5176,strictPort:true},build:{outDir:'dist-phase6',rollupOptions:{input:'phase6.html'}}});
