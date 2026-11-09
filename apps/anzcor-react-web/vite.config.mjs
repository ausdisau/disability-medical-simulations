import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
export default defineConfig({base:'./',plugins:[react()],build:{rollupOptions:{input:{index:resolve('index.html'),embed:resolve('embed.html'),host:resolve('host-wrapper.html'),freeplay:resolve('freeplay.html')}}}});
