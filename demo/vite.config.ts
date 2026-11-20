import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'endless-roll': resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
