import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // Cloudflare Pages specific: Copy index.html to 404.html to handle SPA routing on refresh
        const distDir = path.resolve(__dirname, 'dist');
        const indexHtml = path.join(distDir, 'index.html');
        const notFoundHtml = path.join(distDir, '404.html');
        
        if (fs.existsSync(indexHtml)) {
          fs.copyFileSync(indexHtml, notFoundHtml);
          console.log('✨ Created 404.html for Cloudflare Pages SPA routing');
        } else {
          console.warn('⚠️ index.html not found in dist, skipping 404.html creation');
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});