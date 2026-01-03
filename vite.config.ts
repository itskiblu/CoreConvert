
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    // Critical fix: Modern code-splitting builds require workers to be in 'es' format.
    // This resolves the "[commonjs--resolver] Invalid value 'iife' for option 'worker.format'" error.
    format: 'es',
  },
  build: {
    rollupOptions: {
      // Externalize dependencies that are already provided via the importmap in index.html.
      // This prevents Vite from attempting to bundle them, which avoids issues with 
      // internal web workers and Node.js built-ins like 'path' during the build process.
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'jszip',
        '@google/genai',
        'three',
        'heic2any',
        'utif',
        'ag-psd',
        '@jsquash/avif',
        'gifenc',
        'mammoth',
        'jspdf',
        'marked',
        'turndown',
        'html2canvas',
        'pdfjs-dist',
        'js-yaml',
        'pptxgenjs',
        'opentype.js',
        'lamejs',
        'xlsx'
      ],
    },
  },
});
