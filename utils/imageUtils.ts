

/**
 * Wraps PNG data in an ICO container. 
 * ICO format: Header (6 bytes) + Directory Entry (16 bytes) + Image Data.
 * This manually constructs the binary data required for a valid .ico file
 * without needing an external library.
 */
async function wrapPngAsIco(pngBlob: Blob): Promise<Blob> {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngData = new Uint8Array(pngBuffer);
  
  // ICO Header
  const header = new Uint8Array(6);
  header[2] = 1; // Type 1 (Icon)
  header[4] = 1; // Number of images (1)
  
  // Directory Entry
  const entry = new Uint8Array(16);
  // Width/Height: 0 means 256px. Standard favicon is 32. 
  // We'll use actual dimensions if small, otherwise assume it's standard.
  entry[0] = 32; 
  entry[1] = 32;
  entry[4] = 1; // Color planes
  entry[6] = 32; // Bits per pixel
  
  // Data Size (4 bytes, little-endian)
  const size = pngData.length;
  entry[8] = size & 0xFF;
  entry[9] = (size >> 8) & 0xFF;
  entry[10] = (size >> 16) & 0xFF;
  entry[11] = (size >> 24) & 0xFF;
  
  // Offset (4 bytes, little-endian) - Header(6) + Entry(16) = 22
  entry[12] = 22;
  entry[13] = 0;
  entry[14] = 0;
  entry[15] = 0;
  
  return new Blob([header, entry, pngData], { type: 'image/x-icon' });
}

/**
 * Primary image conversion utility.
 * Uses the HTML5 Canvas API to draw the source image and export it
 * as the desired MIME type.
 * 
 * @param file Source file or blob
 * @param targetMimeType Mime type to export canvas as (e.g. image/jpeg)
 * @param grayscale Apply CSS filter for grayscale processing
 * @param quality Quality argument for lossy formats (0 to 1)
 */
export async function convertImage(
  file: File | Blob, 
  targetMimeType: string, 
  grayscale: boolean = false,
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const isIco = targetMimeType === 'image/x-icon' || targetMimeType === 'image/vnd.microsoft.icon';
      
      // Force standard favicon size if converting to ICO
      if (isIco) {
        canvas.width = 32;
        canvas.height = 32;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      if (grayscale) {
        ctx.filter = 'grayscale(100%)';
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // We always encode as PNG first if target is ICO, then wrap it manually.
      const encodingMime = isIco ? 'image/png' : targetMimeType;

      canvas.toBlob(async (blob) => {
        if (blob) {
          if (isIco) {
            try {
              const icoBlob = await wrapPngAsIco(blob);
              resolve(icoBlob);
            } catch (err) {
              reject(new Error('ICO encoding failed'));
            }
          } else {
            resolve(blob);
          }
        } else {
          reject(new Error('Conversion failed'));
        }
      }, encodingMime, quality);
    };

    img.onerror = () => reject(new Error('Image loading failed'));
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Handle Apple's HEIC format using heic2any library (loaded via CDN).
 * Decodes the proprietary container into a standard Blob.
 */
export async function convertHeic(file: File, targetMimeType: string): Promise<Blob> {
  // @ts-ignore - heic2any is loaded via script tag
  const heic2any = window.heic2any;
  if (!heic2any) throw new Error("HEIC decoder not loaded");

  const resultBlob = await heic2any({
    blob: file,
    toType: targetMimeType,
    quality: 0.92
  });
  
  // resultBlob can be an array if multi-frame, we take the first
  const blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
  return blob;
}

/**
 * Converts TIFF using UTIF.js
 */
export async function convertTiff(file: File, targetMimeType: string): Promise<Blob> {
  // @ts-ignore
  const UTIF = window.UTIF;
  if (!UTIF) throw new Error("UTIF library not loaded");

  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds || ifds.length === 0) throw new Error("Invalid TIFF");
  
  const ifd = ifds[0]; // Take first page
  UTIF.decodeImage(buffer, ifd);
  const rgba = UTIF.toRGBA8(ifd);
  
  const canvas = document.createElement('canvas');
  canvas.width = ifd.width;
  canvas.height = ifd.height;
  const ctx = canvas.getContext('2d');
  if(!ctx) throw new Error("Canvas ctx error");
  
  const imageData = new ImageData(new Uint8ClampedArray(rgba), ifd.width, ifd.height);
  ctx.putImageData(imageData, 0, 0);
  
  return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("TIFF conversion failed"));
      }, targetMimeType, 0.92);
  });
}

/**
 * Converts Scalable Vector Graphics (SVG) to raster images (PNG, JPG, etc).
 * It loads the SVG as a data URI into an Image element, then draws to Canvas.
 */
export async function convertSvg(file: File, targetMimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      const img = new Image();
      // Explicitly set charset to ensure proper parsing
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Scale up by 2x for crisper rasterization on high-DPI screens
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        // JPEG requires a white background, otherwise transparency becomes black
        ctx.fillStyle = targetMimeType === 'image/jpeg' ? 'white' : 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('SVG rasterization failed'));
        }, targetMimeType, 1.0);
      };
      
      img.src = url;
    };
    reader.readAsText(file);
  });
}

/**
 * Wraps a standard image (JPG, PNG) inside an SVG container.
 * Useful for embedding raster images in vector contexts.
 */
export async function imageToSvg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <image width="${img.width}" height="${img.height}" xlink:href="${base64}" />
</svg>`.trim();
        resolve(new Blob([svgString], { type: 'image/svg+xml' }));
      };
      img.onerror = () => reject(new Error('Failed to parse image for SVG wrapper'));
      img.src = base64;
    };
    reader.onerror = () => reject(new Error('Failed to read file as base64'));
    reader.readAsDataURL(file);
  });
}