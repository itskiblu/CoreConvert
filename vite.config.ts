
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    // Critical fix: Modern code-splitting builds require workers to be in 'es' format.
    format: 'es',
  },
  build: {
    rollupOptions: {
      // Bundling React and core framework dependencies is the most efficient way to 
      // flatten the network dependency tree for LCP and ensures runtime stability.
      // Heavy utility libraries (Three, XLSX, etc.) remain in the importmap for dynamic loading.
    },
  },
});
