
import React, { useState, useRef, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { FileItem, ConversionStatus, ConversionType } from './types';
import { 
  CONVERSION_OPTIONS, 
  ICONS, 
  isImage, 
  isHeic, 
  isTiff, 
  isSvg, 
  isPdf, 
  isAudio, 
  isVideo, 
  is3d,
  isFont,
  isJson, 
  isCsv, 
  isTsv,
  isYaml, 
  isXml, 
  isXlsx, 
  isMd, 
  isDocx, 
  isHtml, 
  isText 
} from './constants';
import { ConversionCard } from './components/ConversionCard';
import { PrivacyContent } from './components/PrivacyContent';
import { TermsContent } from './components/TermsContent';
import { AboutContent } from './components/AboutContent';
import { convertImage, convertSvg, imageToSvg, convertHeic, convertTiff } from './utils/imageUtils';
import { 
  readFileAsText, 
  jsonToCsv, 
  csvToJson, 
  fileToBase64, 
  formatJson, 
  jsonToYaml, 
  yamlToJson, 
  xmlToJson, 
  jsonToXml,
  jsonToSql,
  xlsxToJson,
  xlsxToCsv,
  markdownToHtml,
  docxToHtml,
  docxToText,
  htmlToMarkdown,
  formatXml,
  urlEncode,
  urlDecode,
  base64Decode
} from './utils/dataUtils';
import { decodeAudio, audioBufferToWav, audioBufferToMp3, convertAudioViaRecorder } from './utils/audioUtils';
import { takeVideoSnapshot, convertVideo } from './utils/videoUtils';
import { imageToPdf, textToPdf, pdfToImage, getPdfPreview } from './utils/pdfUtils';
import { convertModel, modelToImage } from './utils/modelUtils';
import { fontToTtf, fontToOtf, fontToWoff, fontToJson, fontToCss } from './utils/fontUtils';

interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'alert';
}

/**
 * Main Application Component
 * Handles global state, file management, and routing to utility functions.
 */
export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'about'>('home');
  const [files, setFiles] = useState<FileItem[]>([]);
  // Ref to keep track of files without causing re-renders in useCallback dependencies
  const filesRef = useRef<FileItem[]>(files);
  const [isZipping, setIsZipping] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unsupportedFileName, setUnsupportedFileName] = useState<string | null>(null);
  
  // Sync ref with state
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Initialize dark mode from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('core-dark-mode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply dark mode class to HTML root
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('core-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const triggerNotification = useCallback((type: 'success' | 'alert' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message: type === 'success' ? 'SUCCESS' : '!', type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 2000);
  }, [removeNotification]);

  /**
   * Handles incoming files from the file picker.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const validFiles: FileItem[] = [];
    
    for (const file of selectedFiles) {
      const name = file.name.toLowerCase();
      const mime = file.type.toLowerCase();

      // Detection Logic using shared constants
      const isPng = mime === 'image/png' || name.endsWith('.png');
      const isJpg = mime === 'image/jpeg' || mime === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg');
      const isIco = name.endsWith('.ico') || mime.includes('icon');
      
      const fileIsImage = isImage(file);
      const fileIsHeic = isHeic(file);
      const fileIsTiff = isTiff(file);
      const fileIsSvg = isSvg(file);
      const fileIsPdf = isPdf(file);
      const fileIsAudio = isAudio(file);
      const fileIsVideo = isVideo(file);
      const fileIs3d = is3d(file);
      const fileIsFont = isFont(file);
      const fileIsJson = isJson(file);
      const fileIsCsv = isCsv(file);
      const fileIsTsv = isTsv(file);
      const fileIsYaml = isYaml(file);
      const fileIsXml = isXml(file);
      const fileIsXlsx = isXlsx(file);
      const fileIsMd = isMd(file);
      const fileIsDocx = isDocx(file);
      const fileIsHtml = isHtml(file);
      const fileIsText = isText(file);

      const isRecognized = fileIsImage || fileIsHeic || fileIsTiff || fileIsSvg || fileIsPdf || fileIsAudio || fileIsVideo || fileIs3d || fileIsFont || fileIsJson || fileIsCsv || fileIsTsv || fileIsYaml || fileIsXml || fileIsXlsx || fileIsMd || fileIsDocx || fileIsHtml || fileIsText;

      if (!isRecognized) {
        setUnsupportedFileName(file.name);
        continue;
      }
      
      let defaultType: ConversionType = 'PASSTHROUGH';
      let previewUrl: string | undefined = undefined;

      // Determine default conversion suggestion
      if (fileIsHeic) {
        defaultType = 'HEIC_TO_PNG';
      }
      else if (fileIsTiff) {
        defaultType = 'TIFF_TO_PNG';
      }
      else if (fileIsImage) {
        if (isIco) defaultType = 'IMAGE_TO_PNG';
        else if (isPng) defaultType = 'IMAGE_TO_JPG';
        else if (isJpg) defaultType = 'IMAGE_TO_PNG';
        else defaultType = 'IMAGE_TO_PNG';
        previewUrl = URL.createObjectURL(file);
      }
      else if (fileIsSvg) {
        defaultType = 'SVG_TO_PNG';
        previewUrl = URL.createObjectURL(file);
      }
      else if (fileIsPdf) {
        defaultType = 'PDF_TO_PNG';
        previewUrl = await getPdfPreview(file);
      }
      else if (fileIsDocx) {
        defaultType = 'DOCX_TO_HTML';
      }
      else if (fileIsAudio) {
        const isMp3 = mime === 'audio/mpeg' || name.endsWith('.mp3');
        defaultType = isMp3 ? 'AUDIO_TO_WAV' : 'AUDIO_TO_MP3';
      }
      else if (fileIsVideo) {
        const isMp4 = mime === 'video/mp4' || name.endsWith('.mp4');
        const isWebm = mime === 'video/webm' || name.endsWith('.webm');
        if (isMp4) defaultType = 'VIDEO_TO_WEBM';
        else if (isWebm) defaultType = 'VIDEO_TO_MP4';
        else defaultType = 'VIDEO_TO_MP4';
      }
      else if (fileIs3d) {
        const isStl = name.endsWith('.stl');
        const isObj = name.endsWith('.obj');
        if (isStl) defaultType = 'STL_TO_OBJ';
        else if (isObj) defaultType = 'OBJ_TO_STL';
        else defaultType = 'MODEL_TO_IMAGE';
      }
      else if (fileIsFont) {
        const isTtf = name.endsWith('.ttf');
        defaultType = isTtf ? 'FONT_TO_WOFF' : 'FONT_TO_TTF';
      }
      else if (fileIsJson) defaultType = 'JSON_TO_CSV';
      else if (fileIsCsv) defaultType = 'CSV_TO_JSON';
      else if (fileIsTsv) defaultType = 'TSV_TO_JSON';
      else if (fileIsYaml) defaultType = 'YAML_TO_JSON';
      else if (fileIsXml) defaultType = 'XML_TO_JSON';
      else if (fileIsXlsx) defaultType = 'XLSX_TO_JSON';
      else if (fileIsMd) defaultType = 'MARKDOWN_TO_PDF';
      else if (fileIsHtml) defaultType = 'HTML_TO_MARKDOWN';
      else if (fileIsText) defaultType = 'TEXT_TO_PDF';

      validFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl,
        status: ConversionStatus.IDLE,
        progress: 0,
        type: defaultType
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.resultUrl) URL.revokeObjectURL(item.resultUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const updateFileType = useCallback((id: string, type: ConversionType) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, type } : f));
  }, []);

  /**
   * Core Logic Switch.
   * Routes the conversion request to the appropriate utility function
   * based on the selected ConversionType.
   */
  const processConversion = useCallback(async (id: string) => {
    // Read from ref to get the current state without adding 'files' dependency
    const item = filesRef.current.find(f => f.id === id);
    if (!item || item.status === ConversionStatus.PROCESSING) return;

    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ConversionStatus.PROCESSING, progress: 10 } : f));

    try {
      let resultBlob: Blob | null = null;
      let resultExtension = '';

      switch (item.type) {
        // --- Image Operations ---
        case 'HEIC_TO_PNG':
        case 'HEIC_TO_JPG': {
          const mime = item.type === 'HEIC_TO_PNG' ? 'image/png' : 'image/jpeg';
          resultBlob = await convertHeic(item.file, mime);
          resultExtension = item.type === 'HEIC_TO_PNG' ? 'png' : 'jpg';
          break;
        }
        case 'TIFF_TO_PNG':
        case 'TIFF_TO_JPG': {
          const mime = item.type === 'TIFF_TO_PNG' ? 'image/png' : 'image/jpeg';
          resultBlob = await convertTiff(item.file, mime);
          resultExtension = item.type === 'TIFF_TO_PNG' ? 'png' : 'jpg';
          break;
        }
        case 'TIFF_TO_PDF': {
          const pngBlob = await convertTiff(item.file, 'image/png');
          const pngFile = new File([pngBlob], 'temp.png', { type: 'image/png' });
          resultBlob = await imageToPdf(pngFile);
          resultExtension = 'pdf';
          break;
        }
        case 'IMAGE_TO_PNG':
        case 'SVG_TO_PNG':
          resultBlob = item.file.type.includes('svg') ? await convertSvg(item.file, 'image/png') : await convertImage(item.file, 'image/png');
          resultExtension = 'png';
          break;
        case 'IMAGE_TO_JPG':
        case 'SVG_TO_JPG':
          resultBlob = item.file.type.includes('svg') ? await convertSvg(item.file, 'image/jpeg') : await convertImage(item.file, 'image/jpeg');
          resultExtension = 'jpg';
          break;
        case 'IMAGE_TO_WEBP':
        case 'SVG_TO_WEBP':
          resultBlob = item.file.type.includes('svg') ? await convertSvg(item.file, 'image/webp') : await convertImage(item.file, 'image/webp');
          resultExtension = 'webp';
          break;
        case 'IMAGE_TO_AVIF':
          resultBlob = await convertImage(item.file, 'image/avif');
          resultExtension = 'avif';
          break;
        case 'IMAGE_TO_SVG':
          resultBlob = await imageToSvg(item.file);
          resultExtension = 'svg';
          break;
        case 'IMAGE_TO_ICO':
          resultBlob = await convertImage(item.file, 'image/x-icon');
          resultExtension = 'ico';
          break;
        case 'IMAGE_TO_BMP':
          resultBlob = await convertImage(item.file, 'image/bmp');
          resultExtension = 'bmp';
          break;
        case 'IMAGE_GRAYSCALE':
          resultExtension = item.file.name.split('.').pop() || 'png';
          resultBlob = await convertImage(item.file, item.file.type || 'image/png', true);
          break;
        case 'IMAGE_TO_PDF':
          resultBlob = await imageToPdf(item.file);
          resultExtension = 'pdf';
          break;
          
        // --- Document Operations ---
        case 'TEXT_TO_PDF':
        case 'MARKDOWN_TO_PDF': {
          const text = await readFileAsText(item.file);
          resultBlob = await textToPdf(text);
          resultExtension = 'pdf';
          break;
        }
        case 'PDF_TO_PNG':
          resultBlob = await pdfToImage(item.file);
          resultExtension = 'png';
          break;
        case 'DOCX_TO_HTML': {
          const html = await docxToHtml(item.file);
          resultBlob = new Blob([html], { type: 'text/html' });
          resultExtension = 'html';
          break;
        }
        case 'DOCX_TO_TEXT': {
          const text = await docxToText(item.file);
          resultBlob = new Blob([text], { type: 'text/plain' });
          resultExtension = 'txt';
          break;
        }
        case 'DOCX_TO_MARKDOWN': {
          const html = await docxToHtml(item.file);
          const md = await htmlToMarkdown(html);
          resultBlob = new Blob([md], { type: 'text/markdown' });
          resultExtension = 'md';
          break;
        }
          
        // --- Data Operations ---
        case 'XLSX_TO_JSON': {
          const jsonStr = await xlsxToJson(item.file);
          resultBlob = new Blob([jsonStr], { type: 'application/json' });
          resultExtension = 'json';
          break;
        }
        case 'XLSX_TO_CSV': {
          const csvStr = await xlsxToCsv(item.file);
          resultBlob = new Blob([csvStr], { type: 'text/csv' });
          resultExtension = 'csv';
          break;
        }
        case 'JSON_TO_CSV':
        case 'JSON_TO_TSV':
        case 'CSV_TO_JSON':
        case 'CSV_TO_TSV':
        case 'TSV_TO_JSON':
        case 'TSV_TO_CSV':
        case 'JSON_TO_YAML':
        case 'YAML_TO_JSON':
        case 'XML_TO_JSON':
        case 'JSON_TO_XML':
        case 'JSON_TO_SQL':
        case 'CSV_TO_SQL':
        case 'CSV_TO_YAML':
        case 'CSV_TO_XML':
        case 'YAML_TO_CSV':
        case 'YAML_TO_XML':
        case 'XML_TO_CSV':
        case 'XML_TO_YAML': {
          const rawText = await readFileAsText(item.file);
          const safeBaseName = item.file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
          let intermediateJson: string;

          if (item.file.name.endsWith('.csv')) intermediateJson = csvToJson(rawText);
          else if (item.file.name.endsWith('.tsv') || item.type.startsWith('TSV_')) intermediateJson = csvToJson(rawText, '\t');
          else if (item.file.name.endsWith('.yaml') || item.file.name.endsWith('.yml')) intermediateJson = await yamlToJson(rawText);
          else if (item.file.name.endsWith('.xml')) intermediateJson = xmlToJson(rawText);
          else intermediateJson = rawText; 

          let finalContent: string;
          if (item.type.endsWith('_TO_CSV')) {
            finalContent = jsonToCsv(intermediateJson);
            resultExtension = 'csv';
          } else if (item.type.endsWith('_TO_TSV')) {
            finalContent = jsonToCsv(intermediateJson, '\t');
            resultExtension = 'tsv';
          } else if (item.type.endsWith('_TO_YAML')) {
            finalContent = await jsonToYaml(intermediateJson);
            resultExtension = 'yaml';
          } else if (item.type.endsWith('_TO_XML')) {
            finalContent = jsonToXml(intermediateJson);
            resultExtension = 'xml';
          } else if (item.type.endsWith('_TO_SQL')) {
            finalContent = jsonToSql(intermediateJson, safeBaseName);
            resultExtension = 'sql';
          } else {
            finalContent = formatJson(intermediateJson);
            resultExtension = 'json';
          }
          resultBlob = new Blob([finalContent], { type: 'text/plain' });
          break;
        }

        // --- Audio Operations ---
        case 'AUDIO_TO_MP3':
        case 'VIDEO_TO_MP3': {
          const buffer = await decodeAudio(item.file);
          resultBlob = await audioBufferToMp3(buffer, 128);
          resultExtension = 'mp3';
          break;
        }
        case 'AUDIO_TO_WAV': {
          const buffer = await decodeAudio(item.file);
          resultBlob = await audioBufferToWav(buffer);
          resultExtension = 'wav';
          break;
        }
        case 'AUDIO_TO_OGG': {
          resultBlob = await convertAudioViaRecorder(item.file, 'ogg', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'ogg';
          break;
        }
        case 'AUDIO_TO_M4A': {
          resultBlob = await convertAudioViaRecorder(item.file, 'm4a', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'm4a';
          break;
        }
        case 'AUDIO_TO_WEBM': {
          resultBlob = await convertAudioViaRecorder(item.file, 'webm', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'webm';
          break;
        }
        case 'AUDIO_TO_FLAC': {
          resultBlob = await convertAudioViaRecorder(item.file, 'flac', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'flac';
          break;
        }
        case 'AUDIO_TO_AAC': {
          resultBlob = await convertAudioViaRecorder(item.file, 'aac', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'aac';
          break;
        }
        case 'AUDIO_TO_OPUS': {
          resultBlob = await convertAudioViaRecorder(item.file, 'opus', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'opus';
          break;
        }
        case 'AUDIO_TO_M4R': {
          resultBlob = await convertAudioViaRecorder(item.file, 'm4r', (p) => {
             setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'm4r';
          break;
        }

        // --- Video Operations ---
        case 'VIDEO_TO_WEBM': {
          resultBlob = await convertVideo(item.file, { targetMime: 'video/webm' }, (p) => {
            setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'webm';
          break;
        }
        case 'VIDEO_TO_MP4': {
          resultBlob = await convertVideo(item.file, { targetMime: 'video/mp4' }, (p) => {
            setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: p } : f));
          });
          resultExtension = 'mp4';
          break;
        }
        case 'VIDEO_SNAPSHOT': {
          resultBlob = await takeVideoSnapshot(item.file);
          resultExtension = 'png';
          break;
        }

        // --- 3D Operations ---
        case 'OBJ_TO_STL':
        case 'GLB_TO_STL':
        case 'PLY_TO_STL': {
          resultBlob = await convertModel(item.file, 'stl');
          resultExtension = 'stl';
          break;
        }
        case 'STL_TO_OBJ':
        case 'GLB_TO_OBJ':
        case 'PLY_TO_OBJ': {
          resultBlob = await convertModel(item.file, 'obj');
          resultExtension = 'obj';
          break;
        }
        case 'OBJ_TO_GLB':
        case 'STL_TO_GLB':
        case 'PLY_TO_GLB': {
          resultBlob = await convertModel(item.file, 'glb');
          resultExtension = 'glb';
          break;
        }
        case 'OBJ_TO_USDZ':
        case 'STL_TO_USDZ':
        case 'GLB_TO_USDZ': {
          resultBlob = await convertModel(item.file, 'usdz');
          resultExtension = 'usdz';
          break;
        }
        case 'MODEL_TO_IMAGE': {
          resultBlob = await modelToImage(item.file);
          resultExtension = 'png';
          break;
        }
        
        // --- Font Operations ---
        case 'FONT_TO_TTF': {
          resultBlob = await fontToTtf(item.file);
          resultExtension = 'ttf';
          break;
        }
        case 'FONT_TO_OTF': {
          resultBlob = await fontToOtf(item.file);
          resultExtension = 'otf';
          break;
        }
        case 'FONT_TO_WOFF': {
          resultBlob = await fontToWoff(item.file);
          resultExtension = 'woff';
          break;
        }
        case 'FONT_TO_JSON': {
          resultBlob = await fontToJson(item.file);
          resultExtension = 'json';
          break;
        }
        case 'FONT_TO_CSS': {
          resultBlob = await fontToCss(item.file);
          resultExtension = 'css';
          break;
        }
        
        // --- Utilities ---
        case 'MARKDOWN_TO_HTML': {
          const text = await readFileAsText(item.file);
          const html = await markdownToHtml(text);
          resultBlob = new Blob([html], { type: 'text/html' });
          resultExtension = 'html';
          break;
        }
        case 'HTML_TO_MARKDOWN': {
          const text = await readFileAsText(item.file);
          const md = await htmlToMarkdown(text);
          resultBlob = new Blob([md], { type: 'text/markdown' });
          resultExtension = 'md';
          break;
        }
        case 'HTML_TO_TEXT': {
          const text = await readFileAsText(item.file);
          const doc = new DOMParser().parseFromString(text, 'text/html');
          const plain = doc.body.textContent || "";
          resultBlob = new Blob([plain], { type: 'text/plain' });
          resultExtension = 'txt';
          break;
        }
        case 'JSON_PRETTIFY': {
          const text = await readFileAsText(item.file);
          const formatted = formatJson(text, 2);
          resultBlob = new Blob([formatted], { type: 'application/json' });
          resultExtension = 'json';
          break;
        }
        case 'JSON_MINIFY': {
          const text = await readFileAsText(item.file);
          const formatted = formatJson(text, 0);
          resultBlob = new Blob([formatted], { type: 'application/json' });
          resultExtension = 'json';
          break;
        }
        case 'XML_PRETTIFY': {
          const text = await readFileAsText(item.file);
          const formatted = formatXml(text, false);
          resultBlob = new Blob([formatted], { type: 'text/xml' });
          resultExtension = 'xml';
          break;
        }
        case 'XML_MINIFY': {
          const text = await readFileAsText(item.file);
          const formatted = formatXml(text, true);
          resultBlob = new Blob([formatted], { type: 'text/xml' });
          resultExtension = 'xml';
          break;
        }
        case 'URL_ENCODE': {
          const text = await readFileAsText(item.file);
          resultBlob = new Blob([urlEncode(text)], { type: 'text/plain' });
          resultExtension = 'txt';
          break;
        }
        case 'URL_DECODE': {
          const text = await readFileAsText(item.file);
          resultBlob = new Blob([urlDecode(text)], { type: 'text/plain' });
          resultExtension = 'txt';
          break;
        }
        case 'BASE64_ENCODE': {
          const base64 = await fileToBase64(item.file);
          resultBlob = new Blob([base64], { type: 'text/plain' });
          resultExtension = 'base64.txt';
          break;
        }
        case 'BASE64_DECODE': {
          const text = await readFileAsText(item.file);
          const decoded = base64Decode(text);
          resultBlob = new Blob([decoded], { type: 'text/plain' });
          resultExtension = 'txt';
          break;
        }
        case 'FILE_TO_ZIP': {
          const zip = new JSZip();
          zip.file(item.file.name, item.file);
          resultBlob = await zip.generateAsync({ type: 'blob' });
          resultExtension = 'zip';
          break;
        }
        case 'PASSTHROUGH': {
          resultBlob = new Blob([item.file], { type: item.file.type });
          resultExtension = item.file.name.split('.').pop() || '';
          break;
        }
      }

      if (resultBlob) {
        const url = URL.createObjectURL(resultBlob);
        const nameParts = item.file.name.split('.');
        const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : nameParts[0];
        const newName = item.type === 'PASSTHROUGH' 
          ? item.file.name 
          : `${baseName}_transformed.${resultExtension}`;
          
        setFiles(prev => prev.map(f => f.id === id ? { 
          ...f, 
          status: ConversionStatus.COMPLETED, 
          progress: 100,
          resultUrl: url,
          resultName: newName,
          previewUrl: (resultExtension === 'png' || resultExtension === 'jpg' || resultExtension === 'webp' || resultExtension === 'bmp' || resultExtension === 'ico' || resultExtension === 'avif') ? url : f.previewUrl,
          file: new File([resultBlob!], newName, { type: resultBlob!.type })
        } : f));
      }
    } catch (err: any) {
      console.error("Conversion failed:", err);
      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: ConversionStatus.FAILED, 
        progress: 0,
        error: err.message || 'Error occurred.'
      } : f));
    }
  }, []);

  const convertAll = () => {
    files.filter(f => f.status === ConversionStatus.IDLE).forEach(f => processConversion(f.id));
  };

  /**
   * Zips all completed files into a single download archive.
   */
  const downloadAll = async () => {
    const completedFiles = files.filter(f => f.status === ConversionStatus.COMPLETED);
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      const item = completedFiles[0];
      if (item.resultUrl && item.resultName) {
        const link = document.createElement('a');
        link.href = item.resultUrl;
        link.download = item.resultName;
        link.click();
      }
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const promises = completedFiles.map(async (item) => {
        if (!item.resultUrl || !item.resultName) return;
        const response = await fetch(item.resultUrl);
        const blob = await response.blob();
        zip.file(item.resultName, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `CoreConvert_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error("Zipping failed:", error);
      alert("Failed to create zip archive.");
    } finally {
      setIsZipping(false);
    }
  };

  const getGlobalStatus = () => {
    if (files.length === 0) return { label: 'IDLE', color: 'text-gray-400 dark:text-gray-600' };
    if (files.some(f => f.status === ConversionStatus.PROCESSING)) return { label: 'BUSY', color: 'text-brutalYellow' };
    if (files.every(f => f.status === ConversionStatus.COMPLETED || f.status === ConversionStatus.FAILED)) return { label: 'DONE', color: 'text-green-500 dark:text-green-400' };
    return { label: 'READY', color: 'text-blue-500 dark:text-blue-300' };
  };

  const globalStatus = getGlobalStatus();

  // Update title based on status
  useEffect(() => {
    document.title = `CoreConvert | ${globalStatus.label}`;
  }, [globalStatus.label]);

  const inputFiles = files.filter(f => f.status === ConversionStatus.IDLE);
  const outputFiles = files.filter(f => f.status !== ConversionStatus.IDLE);
  const completedCount = files.filter(f => f.status === ConversionStatus.COMPLETED).length;

  const getLinkClass = (view: string) => {
    const isActive = currentView === view;
    return `text-[10px] font-black uppercase px-2 py-0.5 outline-none transition-all duration-100 ${
      isActive 
        ? 'bg-black text-brutalYellow dark:bg-white dark:text-black neubrutal-shadow-sm border border-black dark:border-white' 
        : 'text-black dark:text-white hover:underline decoration-2'
    }`;
  };

  // Callback to trigger triggerNotification in child components
  const onSuccessClick = useCallback(() => triggerNotification('success'), [triggerNotification]);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      {/* Unsupported File Modal Overlay */}
      {unsupportedFileName && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsupported-modal-title"
        >
          <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-6 md:p-10 max-w-md w-full relative">
            <button 
              onClick={() => setUnsupportedFileName(null)}
              className="absolute top-4 right-4 text-black dark:text-white hover:rotate-90 transition-transform"
              aria-label="Close modal"
            >
              <ICONS.X />
            </button>
            <button 
              onClick={() => triggerNotification('alert')}
              className="w-12 h-12 bg-red-500 neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex items-center justify-center mb-6 outline-none"
              aria-label="Trigger test alert"
            >
               <span className="text-white font-black text-2xl">!</span>
            </button>
            <h3 id="unsupported-modal-title" className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Unsupported Type</h3>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-6 uppercase leading-tight">
              The file <span className="text-black dark:text-white underline">{unsupportedFileName}</span> is not currently supported for deep conversion tasks.
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href="https://github.com/itskiblu/CoreConvert" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-brutalYellow text-black neubrutal-border neubrutal-shadow-sm p-3 font-black text-center text-xs uppercase tracking-widest hover:brightness-105 transition-all outline-none"
              >
                Request Support on GitHub
              </a>
              <button 
                onClick={() => setUnsupportedFileName(null)}
                className="w-full bg-black text-white dark:bg-white dark:text-black neubrutal-border neubrutal-shadow-sm p-3 font-black text-xs uppercase tracking-widest outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="mb-8 md:mb-14 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <a 
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView('home');
          }}
          className="flex items-center gap-4 bg-brutalYellow neubrutal-border neubrutal-shadow p-3 md:p-4 neubrutal-button-active-lg outline-none cursor-pointer decoration-0"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-black flex items-center justify-center text-brutalYellow flex-shrink-0">
             <div className="w-5 h-5 md:w-6 md:h-6 border-[3px] border-brutalYellow"></div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tighter uppercase leading-none">CORECONVERT</h1>
        </a>
        
        <div className="flex items-center gap-3 md:gap-4 h-9 md:h-10">
          <div className="h-full bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow-sm px-3 md:px-4 flex items-center font-black text-[10px] md:text-xs uppercase text-black dark:text-white">
            STATUS: <span className={`ml-1 ${globalStatus.color}`}>{globalStatus.label}</span>
          </div>

          <button 
            onClick={toggleTheme}
            className="h-full px-3 md:px-4 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black neubrutal-border neubrutal-shadow-sm flex items-center justify-center font-black text-[10px] md:text-xs uppercase neubrutal-button-active flex-shrink-0 outline-none"
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          {currentView === 'home' && (
            <button 
              onClick={() => setFiles([])}
              className="h-full px-3 md:px-4 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-red-500 hover:text-white dark:hover:bg-red-600 neubrutal-border neubrutal-shadow-sm flex items-center justify-center font-black text-[10px] md:text-xs uppercase neubrutal-button-active flex-shrink-0 outline-none"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Routing Logic */}
      {currentView === 'home' && (
        <main className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-center mb-12">
          
          {/* INPUT COLUMN */}
          <section className="w-full max-w-[480px] flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="bg-black dark:bg-white text-white dark:text-black px-5 py-1.5 font-black text-lg tracking-[0.15em] uppercase neubrutal-shadow-sm">
                INPUT
              </h2>
            </div>
            
            <div className="w-full relative pt-[100%]">
              <div className="absolute inset-0 bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow flex flex-col p-3 md:p-4">
                <div 
                  className={`flex-1 min-h-0 flex flex-col relative outline-none ${inputFiles.length === 0 ? 'border-[3px] border-dashed border-black/30 dark:border-white/30' : 'border-none'}`}
                  tabIndex={-1}
                >
                  <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  
                  {inputFiles.length === 0 ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center p-6 text-center outline-none neubrutal-trigger"
                    >
                      <div className="w-14 h-14 bg-black dark:bg-white text-brutalYellow dark:text-black mb-5 neubrutal-border neubrutal-shadow-sm flex items-center justify-center neubrutal-target">
                        <ICONS.Upload />
                      </div>
                      <p className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Click or Drag Files</p>
                      <p className="text-[10px] font-black text-black dark:text-white mt-1.5 uppercase tracking-[0.2em] opacity-80">Local Browser Processing</p>
                    </button>
                  ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                      <div className="shrink-0 mb-3 px-2 py-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 p-2.5 bg-brutalYellow text-black neubrutal-border neubrutal-shadow-sm neubrutal-button-active cursor-pointer outline-none"
                        >
                          <div className="w-5 h-5 flex items-center justify-center scale-75">
                            <ICONS.Upload />
                          </div>
                          <span className="font-black text-xs uppercase tracking-widest leading-none">Add More Files</span>
                        </button>
                      </div>
                      <div className="flex-1 min-h-0 px-2 pb-3 space-y-3 overflow-y-auto custom-scrollbar">
                        {inputFiles.map(item => (
                          <ConversionCard 
                            key={item.id} 
                            item={item} 
                            onRemove={removeFile}
                            onConvert={processConversion}
                            onChangeType={updateFileType}
                            onSuccessClick={onSuccessClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ACTION CENTER */}
          <div className="flex flex-col items-center justify-center py-1 lg:py-0 shrink-0">
             <button 
               onClick={convertAll}
               disabled={inputFiles.length === 0}
               title="Run Conversion"
               aria-label="Run all conversions"
               className={`p-4 md:p-6 neubrutal-trigger outline-none ${inputFiles.length === 0 ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
             >
               <div className="bg-black dark:bg-white text-brutalYellow dark:text-black p-4 md:p-5 neubrutal-shadow-sm neubrutal-target">
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 rotate-90 lg:rotate-0">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                  </svg>
               </div>
             </button>
          </div>

          {/* OUTPUT COLUMN */}
          <section className="w-full max-w-[480px] flex flex-col">
            <div className="flex items-center gap-3 mb-3 justify-end">
              {completedCount > 1 && (
                <button 
                  onClick={downloadAll}
                  disabled={isZipping}
                  className="bg-brutalYellow text-black px-3 py-1.5 font-black text-[10px] tracking-tighter uppercase neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex items-center gap-1.5 disabled:opacity-50 outline-none"
                >
                  {isZipping ? 'ZIPPING...' : `Export All (${completedCount})`} 
                  {!isZipping && <div className="scale-75"><ICONS.Download /></div>}
                </button>
              )}
              <h2 className="bg-black dark:bg-white text-white dark:text-black px-5 py-1.5 font-black text-lg tracking-[0.15em] uppercase neubrutal-shadow-sm">
                OUTPUT
              </h2>
            </div>
            
            <div className="w-full relative pt-[100%]">
              <div className="absolute inset-0 bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow flex flex-col p-3 md:p-4">
                <div className="flex-1 min-h-0 px-1 space-y-3 overflow-y-auto custom-scrollbar">
                  {outputFiles.length > 0 ? (
                    outputFiles.map(item => (
                      <ConversionCard 
                        key={item.id} 
                        item={item} 
                        onRemove={removeFile}
                        onConvert={processConversion}
                        onChangeType={updateFileType}
                        onSuccessClick={onSuccessClick}
                      />
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-black dark:text-white font-black uppercase tracking-tighter italic opacity-20 dark:opacity-40 text-center p-8 text-sm">
                      Converted files appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {currentView === 'privacy' && (
        <main className="flex-1">
          <PrivacyContent onBack={() => setCurrentView('home')} />
        </main>
      )}

      {currentView === 'terms' && (
        <main className="flex-1">
          <TermsContent onBack={() => setCurrentView('home')} />
        </main>
      )}

      {currentView === 'about' && (
        <main className="flex-1">
          <AboutContent onBack={() => setCurrentView('home')} />
        </main>
      )}

      <footer className="mt-auto pt-10 pb-6 border-t-4 border-black dark:border-white">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="bg-black dark:bg-white text-brutalYellow dark:text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest neubrutal-shadow-sm">
                PRIVATE & SECURE
              </span>
            </div>
            <p className="text-[11px] font-black text-black dark:text-white uppercase tracking-tight opacity-70 max-w-sm md:max-w-none">
              Files are processed locally in your browser. Your data never leaves your device.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-8 items-center justify-center md:justify-end">
            <nav className="flex gap-2 md:gap-4 items-center justify-center">
              <button 
                onClick={() => setCurrentView('about')}
                className={getLinkClass('about')}
              >
                About
              </button>
              <button 
                onClick={() => setCurrentView('privacy')}
                className={getLinkClass('privacy')}
              >
                Privacy
              </button>
              <button 
                onClick={() => setCurrentView('terms')}
                className={getLinkClass('terms')}
              >
                Terms
              </button>
              <a href="https://github.com/itskiblu/CoreConvert" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-black dark:text-white uppercase hover:underline decoration-2 px-2">GitHub</a>
            </nav>
            <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow-sm p-2 px-3">
              <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-tighter">
                &copy; {new Date().getFullYear()} CORECONVERT
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div 
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        role="status" 
        aria-live="polite"
      >
        {notifications.map(n => (
          <div 
            key={n.id}
            onClick={() => removeNotification(n.id)}
            className={`${n.type === 'alert' ? 'bg-red-500' : 'bg-green-400'} text-black neubrutal-border neubrutal-shadow-sm w-16 h-16 flex flex-col items-center justify-center pointer-events-auto cursor-pointer group`}
          >
            {n.type === 'alert' ? (
              <span className="text-white font-black text-2xl">!</span>
            ) : (
              <div className="scale-150 flex items-center justify-center">
                <ICONS.Check />
              </div>
            )}
            <span className="text-[6px] font-black text-black mt-1 group-hover:underline uppercase">{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
