


import { ConversionType } from '../types';

/**
 * Main entry point for image conversion.
 */
export async function convertImageFile(file: File, type: ConversionType): Promise<{ url: string; name: string; blob: Blob }> {
  const canvas = await fileToCanvas(file);
  const targetFormat = getTargetFormat(type);
  const filename = file.name.split('.').slice(0, -1).join('.') + '.' + targetFormat.ext;

  if (targetFormat.mime === 'image/x-icon') {
    const blob = await canvasToIco(canvas);
    const url = URL.createObjectURL(blob);
    return { url, name: filename, blob };
  } 
  
  if (targetFormat.mime === 'image/avif') {
    return convertToAvif(canvas, filename);
  }

  if (targetFormat.mime === 'image/gif') {
    return convertToGif(canvas, filename);
  }

  if (targetFormat.mime === 'image/tiff') {
    return convertToTiff(canvas, filename);
  }
  
  if (targetFormat.mime === 'image/svg+xml') {
    return convertToSvg(canvas, filename);
  }

  // Standard Canvas export
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve({ url, name: filename, blob });
        } else {
          reject(new Error('Canvas conversion failed'));
        }
      },
      targetFormat.mime,
      targetFormat.quality
    );
  });
}

/**
 * Robust AVIF converter with fallback
 */
async function convertToAvif(canvas: HTMLCanvasElement, filename: string): Promise<{ url: string; name: string; blob: Blob }> {
    // 1. Try Native
    const nativeBlob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b) => {
             // If browser supports it, b.type will be image/avif
             if (b && b.type === 'image/avif') resolve(b);
             else resolve(null);
        }, 'image/avif', 0.85);
    });

    if (nativeBlob) {
        return {
            url: URL.createObjectURL(nativeBlob),
            name: filename,
            blob: nativeBlob
        };
    }

    // 2. Fallback to @jsquash/avif (WASM)
    try {
        // @ts-ignore - configured in importmap
        const { encode } = await import('@jsquash/avif'); 
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context lost");
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const buffer = await encode(imageData);
        const blob = new Blob([buffer], { type: 'image/avif' });
        
        return {
            url: URL.createObjectURL(blob),
            name: filename,
            blob
        };
    } catch (e) {
        console.error("AVIF Polyfill failed", e);
        throw new Error("AVIF conversion not supported by this browser. Please try Chrome, Edge, or Firefox.");
    }
}

/**
 * GIF Converter using gifenc
 */
async function convertToGif(canvas: HTMLCanvasElement, filename: string): Promise<{ url: string; name: string; blob: Blob }> {
  return new Promise(async (resolve, reject) => {
    try {
      // @ts-ignore
      const m = await import('gifenc');
      
      const GIFEncoder = m.GIFEncoder || m.default?.GIFEncoder;
      const quantize = m.quantize || m.default?.quantize;
      const applyPalette = m.applyPalette || m.default?.applyPalette;
      
      if (!GIFEncoder || !quantize || !applyPalette) {
         throw new Error("GIF Library failed to load correctly.");
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Context failed");

      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);

      const encoder = new GIFEncoder();
      encoder.writeFrame(index, width, height, { palette });
      encoder.finish();

      const buffer = encoder.bytes();
      const blob = new Blob([buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);

      resolve({ url, name: filename, blob });
    } catch (e) {
      console.error("GIF encoding failed:", e);
      reject(new Error("Failed to encode GIF."));
    }
  });
}

/**
 * TIFF Converter using UTIF
 */
async function convertToTiff(canvas: HTMLCanvasElement, filename: string): Promise<{ url: string; name: string; blob: Blob }> {
    // @ts-ignore
    const UTIF = (await import('utif')).default || await import('utif');
    return new Promise((resolve, reject) => {
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Context failed");
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const tiffBuffer = UTIF.encodeImage(imageData.data, canvas.width, canvas.height);
            const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
            resolve({ url: URL.createObjectURL(blob), name: filename, blob });
        } catch (e) {
            reject(new Error("Failed to encode TIFF."));
        }
    });
}

async function convertToSvg(canvas: HTMLCanvasElement, filename: string): Promise<{ url: string; name: string; blob: Blob }> {
  return new Promise((resolve) => {
    const dataUrl = canvas.toDataURL('image/png');
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />
</svg>`;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    resolve({ url, name: filename, blob });
  });
}

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.heic') || name.endsWith('.heif')) {
    // @ts-ignore
    const heic2any = (await import('heic2any')).default || await import('heic2any');
    const blob = await heic2any({ blob: file, toType: 'image/png' });
    const conversionBlob = Array.isArray(blob) ? blob[0] : blob;
    return loadImage(URL.createObjectURL(conversionBlob));
  }

  if (name.endsWith('.tiff') || name.endsWith('.tif') || /\.(dng|cr2|nef|arw)$/i.test(name)) {
    return loadTiffOrRaw(file);
  }

  if (name.endsWith('.psd')) {
    return loadPsd(file);
  }

  if (type.includes('svg') || name.endsWith('.svg')) {
    return loadSvg(file);
  }

  return loadImage(URL.createObjectURL(file));
}

function loadImage(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Context fail'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
      URL.revokeObjectURL(src);
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function loadSvg(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Context fail'));
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function loadTiffOrRaw(file: File): Promise<HTMLCanvasElement> {
  // @ts-ignore
  const UTIF = (await import('utif')).default || await import('utif');
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (ifds.length === 0) throw new Error("Could not decode image data");
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const canvas = document.createElement('canvas');
  canvas.width = ifds[0].width;
  canvas.height = ifds[0].height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context fail");
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  imageData.data.set(rgba);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function loadPsd(file: File): Promise<HTMLCanvasElement> {
  // @ts-ignore
  const { readPsd } = await import('ag-psd');
  const buffer = await file.arrayBuffer();
  const psd = readPsd(buffer);
  if (!psd.canvas) throw new Error("No image data in PSD");
  return psd.canvas as HTMLCanvasElement;
}

function getTargetFormat(type: ConversionType): { mime: string; ext: string; quality?: number } {
  switch (type) {
    case 'IMAGE_TO_JPG': return { mime: 'image/jpeg', ext: 'jpg', quality: 0.9 };
    case 'IMAGE_COMPRESS': return { mime: 'image/jpeg', ext: 'jpg', quality: 0.6 };
    case 'IMAGE_TO_PNG': return { mime: 'image/png', ext: 'png' };
    case 'IMAGE_TO_WEBP': return { mime: 'image/webp', ext: 'webp', quality: 0.85 };
    case 'IMAGE_COMPRESS_WEBP': return { mime: 'image/webp', ext: 'webp', quality: 0.6 };
    case 'IMAGE_TO_AVIF': return { mime: 'image/avif', ext: 'avif', quality: 0.85 };
    case 'IMAGE_TO_BMP': return { mime: 'image/bmp', ext: 'bmp' };
    case 'IMAGE_TO_GIF': return { mime: 'image/gif', ext: 'gif' };
    case 'IMAGE_TO_TIFF': return { mime: 'image/tiff', ext: 'tiff' };
    case 'IMAGE_TO_SVG': return { mime: 'image/svg+xml', ext: 'svg', quality: 0.9 };
    case 'IMAGE_TO_ICO': return { mime: 'image/x-icon', ext: 'ico' };
    case 'IMAGE_TO_CUR': return { mime: 'image/x-icon', ext: 'cur' };
    case 'IMAGE_GRAYSCALE': return { mime: 'image/png', ext: 'png' };
    default: return { mime: 'image/png', ext: 'png' };
  }
}

function canvasToIco(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    const size = 256;
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = size;
    icoCanvas.height = size;
    const ctx = icoCanvas.getContext('2d');
    const scale = Math.min(size / canvas.width, size / canvas.height);
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    ctx?.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h);

    icoCanvas.toBlob(async (pngBlob) => {
      if (!pngBlob) return;
      const pngBuffer = await pngBlob.arrayBuffer();
      const pngBytes = new Uint8Array(pngBuffer);
      const len = pngBytes.length;
      const icoBytes = new Uint8Array(22 + len);
      icoBytes.set([0, 0, 1, 0, 1, 0], 0);
      icoBytes.set([0, 0, 0, 0, 1, 0, 32, 0, len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff, (len >> 24) & 0xff, 22, 0, 0, 0], 6);
      icoBytes.set(pngBytes, 22);
      resolve(new Blob([icoBytes], { type: 'image/x-icon' }));
    }, 'image/png');
  });
}