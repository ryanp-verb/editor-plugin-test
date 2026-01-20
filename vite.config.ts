import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'BubbleTipTap',
      fileName: 'bubble-tiptap',
      formats: ['iife', 'es']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'bubble-tiptap.[ext]'
      }
    },
    minify: 'esbuild',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
});
