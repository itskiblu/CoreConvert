
import { ConversionType } from '../types';
import { convertPresentationFile } from './presentationUtils';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export async function convertDocumentFile(file: File, type: ConversionType): Promise<ConversionResult> {
  if (type === 'TEXT_TO_PPTX' || type === 'MARKDOWN_TO_PPTX') {
     return convertPresentationFile(file, type);
  }

  const strategy = STRATEGIES[type];
  if (!strategy) throw new Error(`Conversion strategy not implemented for: ${type}`);

  try {
    return await strategy(file);
  } catch (error) {
    throw new Error(`Failed to convert file: ${(error as Error).message}`);
  }
}

type ConversionStrategy = (file: File) => Promise<ConversionResult>;

const STRATEGIES: Partial<Record<ConversionType, ConversionStrategy>> = {
  'DOCX_TO_HTML': (f) => processDocx(f, 'html'),
  'DOCX_TO_TEXT': (f) => processDocx(f, 'text'),
  'DOCX_TO_MARKDOWN': (f) => processDocx(f, 'markdown'),
  'TEXT_TO_HTML': async (f) => {
    const text = await f.text();
    // @ts-ignore
    const { marked } = await import('marked');
    const html = await marked.parse(text);
    return createResult(wrapHtml(html), replaceExt(f.name, 'html'), 'text/html');
  },
  'TEXT_TO_PDF': async (f) => {
    const text = await f.text();
    return generateTextPdf(text, replaceExt(f.name, 'pdf'));
  },
  'TEXT_TO_MARKDOWN': async (f) => {
    const text = await f.text();
    if (f.name.endsWith('.html') || f.type.includes('html')) {
        // @ts-ignore
        const TurndownService = (await import('turndown')).default || await import('turndown');
        const turndownService = new TurndownService();
        return createResult(turndownService.turndown(text), replaceExt(f.name, 'md'), 'text/markdown');
    }
    return createResult(text, replaceExt(f.name, 'md'), 'text/markdown');
  },
  'TEXT_TO_PLAIN': async (f) => {
    const text = await f.text();
    if (f.name.endsWith('.html') || f.type.includes('html')) {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        return createResult(doc.body.textContent || '', replaceExt(f.name, 'txt'), 'text/plain');
    }
    return createResult(text, replaceExt(f.name, 'txt'), 'text/plain');
  },
  'HTML_MINIFY': async (f) => {
    const text = await f.text();
    const minified = text.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    return createResult(minified, f.name, 'text/html');
  },
  'TEXT_UPPERCASE': (f) => transformText(f, t => t.toUpperCase()),
  'TEXT_LOWERCASE': (f) => transformText(f, t => t.toLowerCase()),
  'TEXT_TO_SNAKE_CASE': (f) => transformText(f, t => t.replace(/\s+/g, '_').toLowerCase()),
  'TEXT_TO_CAMEL_CASE': (f) => transformText(f, t => t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase())),
  'IMAGE_TO_PDF': async (f) => generateImagePdf(f),
  'PDF_TO_PNG': async (f) => rasterizePdf(f),
};

async function processDocx(file: File, mode: 'html' | 'text' | 'markdown'): Promise<ConversionResult> {
  // @ts-ignore
  const mammoth = (await import('mammoth')).default || await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  if (mode === 'text') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return createResult(result.value, replaceExt(file.name, 'txt'), 'text/plain');
  }
  const result = await mammoth.convertToHtml({ arrayBuffer });
  if (mode === 'markdown') {
    // @ts-ignore
    const TurndownService = (await import('turndown')).default || await import('turndown');
    return createResult(new TurndownService().turndown(result.value), replaceExt(file.name, 'md'), 'text/markdown');
  }
  return createResult(wrapHtml(result.value), replaceExt(file.name, 'html'), 'text/html');
}

async function generateTextPdf(text: string, filename: string): Promise<ConversionResult> {
  // @ts-ignore
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  doc.setFontSize(11);
  const splitLines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - (margin * 2));
  doc.text(splitLines, margin, margin + 11);
  return createResult(doc.output('blob'), filename, 'application/pdf');
}

async function generateImagePdf(file: File): Promise<ConversionResult> {
  // @ts-ignore
  const { jsPDF } = await import('jspdf');
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const doc = new jsPDF({ unit: 'px', format: [img.width, img.height], hotfixes: ['px_scaling'] });
        doc.addImage(img, 'PNG', 0, 0, img.width, img.height);
        resolve(createResult(doc.output('blob'), replaceExt(file.name, 'pdf'), 'application/pdf'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function rasterizePdf(file: File): Promise<ConversionResult> {
  // @ts-ignore
  const pdfjsLib = await import('pdfjs-dist');
  const pdfjs = pdfjsLib.default || pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer(), cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
  return new Promise(r => canvas.toBlob(b => r(createResult(b!, replaceExt(file.name, 'png'), 'image/png')), 'image/png'));
}

async function transformText(file: File, transform: (text: string) => string): Promise<ConversionResult> {
  return createResult(transform(await file.text()), file.name, 'text/plain');
}

function replaceExt(filename: string, newExt: string): string {
  return filename.split('.').slice(0, -1).join('.') + '.' + newExt;
}

function createResult(content: string | Blob, name: string, type: string): ConversionResult {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  return { url: URL.createObjectURL(blob), name, blob };
}

function wrapHtml(bodyContent: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:0 auto;}img{max-width:100%;}pre{background:#f5f5f5;padding:15px;}</style></head><body>${bodyContent}</body></html>`;
}
