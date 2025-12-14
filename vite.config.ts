import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

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
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});