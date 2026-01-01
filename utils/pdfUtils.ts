
// @ts-nocheck - jspdf and pdfjs are loaded via script tags
import { loadScript } from './scriptLoader';

export async function imageToPdf(file: File): Promise<Blob> {
  await loadScript('jspdf');
  const { jsPDF } = window.jspdf;
  const imgData = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'l' : 'p',
        unit: 'px',
        format: [img.width, img.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);
      resolve(pdf.output('blob'));
    };
    img.src = imgData;
  });
}

export async function textToPdf(text: string, title: string = 'Document'): Promise<Blob> {
  await loadScript('jspdf');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const splitText = pdf.splitTextToSize(text, pageWidth - margin * 2);
  
  pdf.text(splitText, margin, margin + 10);
  return pdf.output('blob');
}

export async function pdfToImage(file: File): Promise<Blob> {
  await loadScript('pdfjs');
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport: viewport }).promise;
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function getPdfPreview(file: File): Promise<string> {
  try {
    const blob = await pdfToImage(file);
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn("Failed to generate PDF preview", e);
    return '';
  }
}
