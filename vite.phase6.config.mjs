import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({plugins:[react()],define:{__FAMILYCONNECT_DEMO__:'true',__FAMILYCONNECT_ENV__:JSON.stringify('local-demo'),__FAMILYCONNECT_CONFIG__:'null'},envPrefix:'VITE_PHASE6_',cacheDir:join(tmpdir(),'familyconnect-phase6-vite'),optimizeDeps:{include:['elkjs/lib/elk-api.js','elkjs/lib/elk.bundled.js','jspdf','svg2pdf.js']},worker:{format:'es'},server:{host:'127.0.0.1',port:5176,strictPort:true},build:{outDir:'dist-phase6',rollupOptions:{input:'phase6.html'}}});
