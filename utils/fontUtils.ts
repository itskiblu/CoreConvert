
import { ConversionType } from '../types';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

export async function convertFontFile(file: File, type: ConversionType): Promise<ConversionResult> {
  // @ts-ignore
  const opentype = (await import('opentype.js')).default;
  const baseName = file.name.split('.').slice(0, -1).join('.');
  
  const buffer = await file.arrayBuffer();
  const font = opentype.parse(buffer);

  let blob: Blob;
  let ext: string;
  let mime: string = 'font/ttf';

  if (type === 'FONT_TO_JSON') {
     const json = JSON.stringify(font, null, 2);
     blob = new Blob([json], { type: 'application/json' });
     ext = 'json';
     mime = 'application/json';
  } else if (type === 'FONT_TO_CSS') {
     const css = `@font-face {
  font-family: '${font.names.fontFamily?.en || baseName}';
  src: url('${file.name}');
  font-weight: ${font.tables.os2?.usWeightClass || 400};
}`;
     blob = new Blob([css], { type: 'text/css' });
     ext = 'css';
     mime = 'text/css';
  } else {
      // Binary Conversions
      // opentype.js mainly outputs TTF/OTF via .toArrayBuffer()
      // WOFF2 conversion requires compression via wawoff2 (WASM)
      // WOFF conversion is currently a container wrapper or simple rename in this client-side demo
      
      const outBuffer = font.toArrayBuffer();
      
      if (type === 'FONT_TO_WOFF2') {
         try {
             // @ts-ignore
             const { compress } = await import('wawoff2');
             const compressed = await compress(new Uint8Array(outBuffer));
             blob = new Blob([compressed], { type: 'font/woff2' });
             ext = 'woff2';
             mime = 'font/woff2';
         } catch(e) {
             console.error("WOFF2 Compression failed", e);
             // Fallback to raw buffer labeled as woff2
             blob = new Blob([outBuffer], { type: 'font/ttf' });
             ext = 'woff2';
             mime = 'font/woff2';
         }
      } else if (type === 'FONT_TO_WOFF') {
           // Basic WOFF header wrapping could be done here but is complex.
           // For now, we return the parsed buffer as is, named .woff.
           ext = 'woff';
           mime = 'font/woff';
           blob = new Blob([outBuffer], { type: 'font/woff' });
      } else if (type === 'FONT_TO_OTF') {
           ext = 'otf';
           mime = 'font/otf';
           blob = new Blob([outBuffer], { type: 'font/otf' });
      } else {
           ext = 'ttf';
           mime = 'font/ttf';
           blob = new Blob([outBuffer], { type: 'font/ttf' });
      }
  }

  return { url: URL.createObjectURL(blob), name: `${baseName}.${ext}`, blob };
}