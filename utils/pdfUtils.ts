


import { ConversionType } from '../types';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import TurndownService from 'turndown';
import * as pdfjsLib from 'pdfjs-dist';
// Import the presentation util to delegate creation
import { convertPresentationFile } from './presentationUtils';
import { generateTextSummary } from './aiUtils';

// Define the return type expected by the App
interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

// ----------------------------------------------------------------------
// PDF.js Worker Configuration
// ----------------------------------------------------------------------
// Robustly handle the export structure of pdfjs-dist
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Use unpkg for the worker source to ensure it serves a standard script compatible with the worker environment.
// esm.sh sometimes serves modules that can confuse the worker loader.
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Configure worker global path if not already set
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

/**
 * Main Dispatcher Function
 * Routes file and type to the appropriate strategy.
 */
export async function convertDocumentFile(file: File, type: ConversionType): Promise<ConversionResult> {
  // Delegate PPTX creation to the specific util
  if (type === 'TEXT_TO_PPTX' || type === 'MARKDOWN_TO_PPTX') {
     return convertPresentationFile(file, type);
  }
  
  // --- AI FEATURES ---
  if (type === 'TEXT_TO_SUMMARY') {
     let text = '';
     if (file.name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
     } else {
        // MD, TXT, HTML, JSON, etc.
        text = await file.text();
     }
     
     const summary = await generateTextSummary(text);
     return createResult(summary, replaceExt(file.name, 'txt'), 'text/plain');
  }

  const strategy = STRATEGIES[type];
  
  if (!strategy) {
    throw new Error(`Conversion strategy not implemented for: ${type}`);
  }

  try {
    return await strategy(file);
  } catch (error) {
    console.error(`Conversion failed for ${type}:`, error);
    throw new Error(`Failed to convert file: ${(error as Error).message}`);
  }
}

// ----------------------------------------------------------------------
// Strategies
// ----------------------------------------------------------------------

type ConversionStrategy = (file: File) => Promise<ConversionResult>;

const STRATEGIES: Partial<Record<ConversionType, ConversionStrategy>> = {
  // --- Microsoft Word (DOCX) ---
  'DOCX_TO_HTML': (f) => processDocx(f, 'html'),
  'DOCX_TO_TEXT': (f) => processDocx(f, 'text'),
  'DOCX_TO_MARKDOWN': (f) => processDocx(f, 'markdown'),

  // --- Generic Text/HTML/Markdown ---
  'TEXT_TO_HTML': async (f) => {
    // If it's already HTML, just return it (or wrap it)
    if (f.name.toLowerCase().endsWith('.html') || f.type.includes('html')) {
        return createResult(await f.text(), f.name, 'text/html');
    }
    // If Markdown
    const text = await f.text();
    // marked.parse can be async
    const html = await marked.parse(text);
    return createResult(wrapHtml(html), replaceExt(f.name, 'html'), 'text/html');
  },

  'TEXT_TO_PDF': async (f) => {
    const text = await f.text();
    return generateTextPdf(text, replaceExt(f.name, 'pdf'));
  },

  'TEXT_TO_MARKDOWN': async (f) => {
    const text = await f.text();
    // If it's HTML, turndown it
    if (f.name.endsWith('.html') || f.type.includes('html')) {
        const turndownService = new TurndownService({ 
          headingStyle: 'atx',
          codeBlockStyle: 'fenced' 
        });
        const md = turndownService.turndown(text);
        return createResult(md, replaceExt(f.name, 'md'), 'text/markdown');
    }
    // If it's already text, just change ext
    return createResult(text, replaceExt(f.name, 'md'), 'text/markdown');
  },

  'TEXT_TO_PLAIN': async (f) => {
    const text = await f.text();
    // If HTML, strip tags
    if (f.name.endsWith('.html') || f.type.includes('html')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return createResult(doc.body.textContent || '', replaceExt(f.name, 'txt'), 'text/plain');
    }
    return createResult(text, replaceExt(f.name, 'txt'), 'text/plain');
  },

  'HTML_MINIFY': async (f) => {
    const text = await f.text();
    // Basic reliable regex minification
    const minified = text
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ')           // Collapse whitespace
      .replace(/>\s+</g, '><')        // Remove space between tags
      .trim();
    return createResult(minified, f.name, 'text/html');
  },

  // --- Plain Text Operations ---
  'TEXT_UPPERCASE': (f) => transformText(f, t => t.toUpperCase()),
  'TEXT_LOWERCASE': (f) => transformText(f, t => t.toLowerCase()),
  'TEXT_TO_SNAKE_CASE': (f) => transformText(f, t => t.replace(/\s+/g, '_').toLowerCase()),
  'TEXT_TO_CAMEL_CASE': (f) => transformText(f, t => 
    t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
  ),

  // --- Image to PDF ---
  'IMAGE_TO_PDF': async (f) => generateImagePdf(f),

  // --- PDF to Image ---
  'PDF_TO_PNG': async (f) => rasterizePdf(f),
};

// ----------------------------------------------------------------------
// Processing Engines
// ----------------------------------------------------------------------

/**
 * Handles DOCX parsing using Mammoth
 */
async function processDocx(file: File, mode: 'html' | 'text' | 'markdown'): Promise<ConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  if (mode === 'text') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return createResult(result.value, replaceExt(file.name, 'txt'), 'text/plain');
  }

  // For HTML/Markdown we start with HTML
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  if (mode === 'markdown') {
    const turndownService = new TurndownService();
    const md = turndownService.turndown(html);
    return createResult(md, replaceExt(file.name, 'md'), 'text/markdown');
  }

  // Wrap partial HTML in a full document structure for better portability
  return createResult(wrapHtml(html), replaceExt(file.name, 'html'), 'text/html');
}

/**
 * Generates a PDF from plain text using jsPDF.
 * Handles pagination and margins automatically.
 */
async function generateTextPdf(text: string, filename: string): Promise<ConversionResult> {
  // @ts-ignore - jsPDF constructor types can be finicky
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  
  const fontSize = 11;
  const lineHeightFactor = 1.5;
  const margin = 40;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - (margin * 2);
  const lineHeight = fontSize * lineHeightFactor;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  
  // Clean text and split into lines that fit the width
  const safeText = text.replace(/\r\n/g, "\n");
  const splitLines = doc.splitTextToSize(safeText, maxLineWidth);
  
  let cursorY = margin + fontSize; // Start position (accounting for baseline)

  for (let i = 0; i < splitLines.length; i++) {
    // Check for page break
    if (cursorY > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + fontSize;
    }
    
    doc.text(splitLines[i], margin, cursorY);
    cursorY += lineHeight;
  }

  const blob = doc.output('blob');
  return createResult(blob, filename, 'application/pdf');
}

/**
 * Embeds an image into a PDF page.
 * Adjusts PDF page size to match the image dimensions exactly.
 */
async function generateImagePdf(file: File): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const orientation = width > height ? 'l' : 'p';
        
        // @ts-ignore
        const doc = new jsPDF({
          orientation,
          unit: 'px',
          format: [width, height],
          hotfixes: ['px_scaling']
        });
        
        doc.addImage(img, 'PNG', 0, 0, width, height);
        const blob = doc.output('blob');
        
        resolve(createResult(blob, replaceExt(file.name, 'pdf'), 'application/pdf'));
      };
      img.onerror = () => reject(new Error("Failed to load image for PDF creation"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Renders the first page of a PDF as a high-resolution PNG.
 */
async function rasterizePdf(file: File): Promise<ConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Double-check worker configuration before document load
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  }

  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    // Use unpkg for CMaps to ensure reliable file access via standard CDN
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });
  
  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);
  
  // Render at 2x scale for crisp quality
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d');
  if (!context) throw new Error("Canvas context creation failed");
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to generate PNG blob"));
      resolve(createResult(blob, replaceExt(file.name, 'png'), 'image/png'));
    }, 'image/png');
  });
}

/**
 * Helper to apply a string transformation to a text file.
 */
async function transformText(file: File, transform: (text: string) => string): Promise<ConversionResult> {
  const text = await file.text();
  const transformed = transform(text);
  return createResult(transformed, file.name, 'text/plain');
}

// ----------------------------------------------------------------------
// Utils
// ----------------------------------------------------------------------

function replaceExt(filename: string, newExt: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) parts.pop();
  return `${parts.join('.')}.${newExt}`;
}

function createResult(content: string | Blob, name: string, type: string): ConversionResult {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  return { url, name, blob };
}

function wrapHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Converted Document</title>
<style>
  body { 
    font-family: system-ui, -apple-system, sans-serif; 
    line-height: 1.6; 
    padding: 40px; 
    max-width: 800px; 
    margin: 0 auto; 
    color: #333; 
    background-color: #fff;
  }
  img { max-width: 100%; height: auto; display: block; margin: 20px 0; }
  pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
  code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
  blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #666; }
  table { border-collapse: collapse; width: 100%; margin: 20px 0; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; font-weight: bold; }
  h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}