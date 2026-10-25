import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: fileURLToPath(new URL('../web-dist', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: 'assets',
  },
  server: {
    strictPort: true,
    proxy: {'/api': {
      target:'http://127.0.0.1:8787', changeOrigin:true,
      // Local Vite dev server talks to the same-origin restricted backend.
      configure(proxy) {proxy.on('proxyReq', req => req.setHeader('Origin','http://127.0.0.1:8787'));},
    }},
  },
});
