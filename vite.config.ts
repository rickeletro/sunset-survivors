import { defineConfig } from 'vite';
import { rankingPlugin } from './server/vite-ranking.mjs';

export default defineConfig({
  base: './',
  plugins: [rankingPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'esnext'
  }
});
