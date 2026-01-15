


import React from 'react';
import { ConversionOption } from './types';

// --- File Type Detectors ---

// Images: Standard + HEIC + PSD + RAW + TIFF + SVG + ICO + BMP
export const isImage = (f: File) => {
  const name = f.name.toLowerCase();
  const type = f.type.toLowerCase();
  
  // Standard
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif|bmp|ico|cur|tiff?|heic|heif|svg)$/i.test(name)) return true;
  // Adobe & Raw
  if (/\.(psd|ai|eps|dng|cr2|nef|arw)$/i.test(name)) return true;
  
  return false;
};

// Data: JSON + CSV + XML + YAML + TSV + Excel + SQL
export const isData = (f: File) => {
  const name = f.name.toLowerCase();
  const type = f.type.toLowerCase();
  return (
    type === 'application/json' ||
    type === 'text/csv' ||
    type.includes('xml') ||
    type === 'text/tab-separated-values' ||
    type === 'application/sql' ||
    type.includes('sql') || 
    /\.(json|csv|tsv|xml|yaml|yml|xlsx|xls|sql)$/i.test(name)
  );
};

// Markup/Text: MD + HTML + TXT + CSS + JS (SQL moved to Data)
export const isTextAndMarkup = (f: File) => {
  const name = f.name.toLowerCase();
  return (
    f.type.startsWith('text/') || 
    /\.(txt|md|markdown|html|htm|css|js|jsx|ts|tsx|log|ini|conf|sh|bat)$/i.test(name)
  ) && !isData(f); // Exclude Data files to avoid clutter
};

// Specific checks for specialized tools
export const isDocx = (f: File) => f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.name.toLowerCase().endsWith('.docx');

// Updated Presentation check to include all requested extensions
export const isPresentation = (f: File) => {
  const name = f.name.toLowerCase();
  return (
    f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
    f.type === 'application/vnd.ms-powerpoint' ||
    /\.(pptx|ppt|pptm|ppsx|ppsm|potx|potm|thmx|sldx|sldm|ppam)$/i.test(name)
  );
};

export const isHtml = (f: File) => f.type.includes('html') || f.name.toLowerCase().endsWith('.html');
export const isCss = (f: File) => f.type.includes('css') || f.name.toLowerCase().endsWith('.css');
export const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

// Media
export const isAudio = (f: File) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|m4r|opus)$/i.test(f.name);
export const isVideo = (f: File) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name);

// 3D & Fonts
export const is3d = (f: File) => /\.(obj|stl|glb|gltf|ply)$/i.test(f.name);
export const isFont = (f: File) => /\.(ttf|otf|woff|woff2)$/i.test(f.name);


// --- Conversion Options Configuration ---

export const CONVERSION_OPTIONS: ConversionOption[] = [
  // --- IMAGES (Input: Any Image) ---
  { value: 'IMAGE_TO_PNG', label: 'Convert to PNG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_JPG', label: 'Convert to JPG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_WEBP', label: 'Convert to WebP', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_AVIF', label: 'Convert to AVIF', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_BMP', label: 'Convert to BMP', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_ICO', label: 'Convert to ICO', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_CUR', label: 'Convert to CUR', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_GIF', label: 'Convert to GIF', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_TIFF', label: 'Convert to TIFF', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_SVG', label: 'Convert to SVG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_PDF', label: 'Convert to PDF', category: 'Document', isSupported: isImage },
  { value: 'IMAGE_GRAYSCALE', label: 'Grayscale Filter', category: 'Image', isSupported: isImage },

  // --- DATA (Input: JSON, CSV, XML, YAML, TSV, XLSX, SQL) ---
  { value: 'DATA_TO_JSON', label: 'Convert to JSON', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_CSV', label: 'Convert to CSV', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_TSV', label: 'Convert to TSV', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_YAML', label: 'Convert to YAML', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_XML', label: 'Convert to XML', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_SQL', label: 'Convert to SQL', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_XLSX', label: 'Convert to Excel (XLSX)', category: 'Data', isSupported: isData },
  { value: 'DATA_PRETTIFY', label: 'Prettify Data', category: 'Data', isSupported: isData },
  { value: 'DATA_MINIFY', label: 'Minify Data', category: 'Data', isSupported: isData },

  // --- TEXT & MARKUP (Input: MD, HTML, TXT) ---
  { value: 'TEXT_TO_HTML', label: 'Convert to HTML', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_MARKDOWN', label: 'Convert to Markdown', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_PLAIN', label: 'Convert to Plain Text', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_PDF', label: 'Convert to PDF', category: 'Document', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_PPTX', label: 'Convert to Slides (PPTX)', category: 'Presentation', isSupported: isTextAndMarkup },
  { value: 'MARKDOWN_TO_PPTX', label: 'Markdown to Slides (PPTX)', category: 'Presentation', isSupported: isTextAndMarkup },
  
  // Text Utilities
  { value: 'TEXT_UPPERCASE', label: 'ALL UPPERCASE', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'TEXT_LOWERCASE', label: 'all lowercase', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_SNAKE_CASE', label: 'snake_case', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_CAMEL_CASE', label: 'camelCase', category: 'Text', isSupported: isTextAndMarkup },
  { value: 'URL_ENCODE', label: 'URL Encode', category: 'Utility', isSupported: isTextAndMarkup },
  { value: 'URL_DECODE', label: 'URL Decode', category: 'Utility', isSupported: isTextAndMarkup },

  // Specific Code Tools
  { value: 'HTML_MINIFY', label: 'Minify HTML', category: 'Text', isSupported: isHtml },
  { value: 'CSS_MINIFY', label: 'Minify CSS', category: 'Text', isSupported: isCss },

  // --- SPECIFIC DOCUMENTS ---
  { value: 'DOCX_TO_HTML', label: 'Word to HTML', category: 'Document', isSupported: isDocx },
  { value: 'DOCX_TO_TEXT', label: 'Word to Text', category: 'Document', isSupported: isDocx },
  { value: 'DOCX_TO_MARKDOWN', label: 'Word to Markdown', category: 'Document', isSupported: isDocx },

  // --- PRESENTATION (PPTX, PPTM, PPSX, POTX, etc) ---
  { value: 'PRESENTATION_TO_PDF', label: 'Slides to PDF', category: 'Presentation', isSupported: isPresentation },
  { value: 'PRESENTATION_TO_HTML', label: 'Slides to HTML', category: 'Presentation', isSupported: isPresentation },
  { value: 'PRESENTATION_TO_TEXT', label: 'Extract Text', category: 'Presentation', isSupported: isPresentation },
  { value: 'PRESENTATION_TO_JSON', label: 'Extract Data (JSON)', category: 'Presentation', isSupported: isPresentation },
  { value: 'PRESENTATION_TO_PPTX', label: 'Convert to Editable PPTX', category: 'Presentation', isSupported: isPresentation },

  // --- AUDIO (Input: Any Audio) ---
  { value: 'AUDIO_TO_MP3', label: 'Convert to MP3', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_WAV', label: 'Convert to WAV', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_M4A', label: 'Convert to M4A (AAC)', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_AAC', label: 'Convert to AAC', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_OGG', label: 'Convert to OGG', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_FLAC', label: 'Convert to FLAC', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_WEBM', label: 'Convert to WebM', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_OPUS', label: 'Convert to OPUS', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_M4R', label: 'Convert to M4R', category: 'Audio', isSupported: isAudio },

  // --- VIDEO (Input: Any Video) ---
  { value: 'VIDEO_TO_MP4', label: 'Convert to MP4', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_WEBM', label: 'Convert to WebM', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_MOV', label: 'Convert to MOV', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_MKV', label: 'Convert to MKV', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_AVI', label: 'Convert to AVI', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_MP3', label: 'Extract Audio (MP3)', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_SNAPSHOT', label: 'Take Snapshot', category: 'Video', isSupported: isVideo },

  // --- 3D (Input: Any 3D) ---
  { value: 'MODEL_TO_STL', label: 'Convert to STL', category: '3D', isSupported: is3d },
  { value: 'MODEL_TO_OBJ', label: 'Convert to OBJ', category: '3D', isSupported: is3d },
  { value: 'MODEL_TO_GLB', label: 'Convert to GLB', category: '3D', isSupported: is3d },
  { value: 'MODEL_TO_USDZ', label: 'Convert to USDZ', category: '3D', isSupported: is3d },
  { value: 'MODEL_TO_IMAGE', label: 'Render to Image', category: '3D', isSupported: is3d },

  // --- FONTS (Input: Any Font) ---
  { value: 'FONT_TO_TTF', label: 'Convert to TTF', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_OTF', label: 'Convert to OTF', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_WOFF', label: 'Convert to WOFF', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_WOFF2', label: 'Convert to WOFF2', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_JSON', label: 'Extract Glyphs', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_CSS', label: 'Generate CSS', category: 'Font', isSupported: isFont },

  // --- UTILITIES ---
  { value: 'PDF_TO_PNG', label: 'PDF to Image (PNG)', category: 'Document', isSupported: isPdf },
  { value: 'BASE64_ENCODE', label: 'Base64 Encode', category: 'Utility', isSupported: () => true },
  { value: 'BASE64_DECODE', label: 'Base64 Decode', category: 'Utility', isSupported: () => true },
  { value: 'FILE_TO_ZIP', label: 'Compress to ZIP', category: 'Utility', isSupported: () => true },
  { value: 'PASSTHROUGH', label: 'Original Format', category: 'Utility', isSupported: () => true },
];

export const ICONS = {
  Upload: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M11 16V7.828l-3.414 3.414L6.172 9.828 12 4l5.828 5.828-1.414 1.414L13 7.828V16h-2zM4 18h16v2H4v-2z" />
    </svg>
  ),
  Check: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
  Download: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm9 2v2H3v-2h18z" />
    </svg>
  ),
  X: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  ),
  
  // Specific Type Icons - Sharp/Brutal Style
  
  Image: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M21 3H3v18h18V3zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  ),
  
  Data: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M15 4v2h3v12h-3v2h5V4h-5zM4 20h5v-2H6V6h3V4H4v16z" />
    </svg>
  ),
  
  Document: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M14 2H4v20h16V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  ),

  Presentation: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M2 3h20v2H2V3zm1 4h18v12H3V7zm2 2v8h14V9H5zm4 1h6v4H9v-4z" />
    </svg>
  ),
  
  Music: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V7h4V3h-7z" />
    </svg>
  ),
  
  Video: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17 10.5V6H3v12h14v-4.5l4 4v-11l-4 4z" />
    </svg>
  ),
  
  '3D': () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2l-9.5 5.5v9L12 22l9.5-5.5v-9L12 2zM5.5 8.68L12 5.12l6.5 3.56v7.12L12 19.32l-6.5-3.56V8.68zM12 13.5l4.5-2.5-4.5-2.5-4.5 2.5 4.5 2.5z" />
    </svg>
  ),

  Font: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z" />
    </svg>
  ),
  
  Utility: () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
    </svg>
  )
};