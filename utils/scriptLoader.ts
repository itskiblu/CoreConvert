
const SCRIPTS = {
  lamejs: 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js',
  jsyaml: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
  marked: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  xlsx: 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
  heic2any: 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
  utif: 'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.min.js',
  mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
  turndown: 'https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.min.js',
  opentype: 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js',
  pako: 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js'
} as const;

type ScriptKey = keyof typeof SCRIPTS;

const loadedScripts = new Set<string>();
const loadingScripts: Partial<Record<ScriptKey, Promise<void>>> = {};

export function loadScript(key: ScriptKey): Promise<void> {
  if (loadedScripts.has(key)) return Promise.resolve();
  if (loadingScripts[key]) return loadingScripts[key]!;

  const src = SCRIPTS[key];
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      loadedScripts.add(key);
      delete loadingScripts[key];
      resolve();
    };
    script.onerror = () => {
      delete loadingScripts[key];
      reject(new Error(`Failed to load library: ${key}`));
    };
    document.head.appendChild(script);
  });

  loadingScripts[key] = promise;
  return promise;
}
