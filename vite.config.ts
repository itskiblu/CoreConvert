
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    // Increase chunk size warning limit as some conversion libs are large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Splitting React and core UI from conversion logic
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['jszip', 'lamejs']
        }
      }
    }
  }
});
