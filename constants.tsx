
import React from 'react';
import { ConversionOption } from './types';

// Exported checks to be used in App.tsx
export const isImage = (f: File) => f.type.startsWith('image/') && !f.type.includes('svg') && !f.type.includes('tiff') && !f.name.toLowerCase().endsWith('.heic');
export const isHeic = (f: File) => f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif');
export const isTiff = (f: File) => f.type === 'image/tiff' || f.name.toLowerCase().endsWith('.tiff') || f.name.toLowerCase().endsWith('.tif');
export const isAvif = (f: File) => f.type === 'image/avif' || f.name.toLowerCase().endsWith('.avif');
export const isSvg = (f: File) => f.type.includes('svg') || f.name.toLowerCase().endsWith('.svg');
export const isJson = (f: File) => f.type === 'application/json' || f.name.toLowerCase().endsWith('.json');
export const isCsv = (f: File) => f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv');
export const isTsv = (f: File) => f.type === 'text/tab-separated-values' || f.name.toLowerCase().endsWith('.tsv');
export const isYaml = (f: File) => f.name.toLowerCase().endsWith('.yaml') || f.name.toLowerCase().endsWith('.yml');
export const isXml = (f: File) => f.type.includes('xml') || f.name.toLowerCase().endsWith('.xml');
export const isXlsx = (f: File) => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls');
export const isMd = (f: File) => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown');
export const isDocx = (f: File) => f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.name.toLowerCase().endsWith('.docx');
export const isHtml = (f: File) => f.type.includes('html') || f.name.toLowerCase().endsWith('.html');
export const isCss = (f: File) => f.type.includes('css') || f.name.toLowerCase().endsWith('.css');
export const isText = (f: File) => f.type.startsWith('text/') || f.name.toLowerCase().endsWith('.txt') || isJson(f) || isCsv(f) || isTsv(f) || isMd(f) || isHtml(f) || isCss(f) || isXml(f);
export const isAudio = (f: File) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|m4r|opus)$/i.test(f.name);
export const isVideo = (f: File) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name);
export const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
export const is3d = (f: File) => /\.(obj|stl|glb|gltf|ply)$/i.test(f.name);
export const isFont = (f: File) => /\.(ttf|otf|woff|woff2)$/i.test(f.name);

export const CONVERSION_OPTIONS: ConversionOption[] = [
  // Images
  { value: 'IMAGE_TO_PNG', label: 'Convert to PNG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_JPG', label: 'Convert to JPG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_WEBP', label: 'Convert to WebP', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_AVIF', label: 'Convert to AVIF', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_SVG', label: 'Convert to SVG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_ICO', label: 'Convert to ICO (Favicon)', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_BMP', label: 'Convert to BMP', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_PDF', label: 'Convert to PDF', category: 'Document', isSupported: isImage },
  { value: 'IMAGE_GRAYSCALE', label: 'Grayscale Filter', category: 'Image', isSupported: isImage },
  
  { value: 'HEIC_TO_PNG', label: 'HEIC to PNG', category: 'Image', isSupported: isHeic },
  { value: 'HEIC_TO_JPG', label: 'HEIC to JPG', category: 'Image', isSupported: isHeic },

  { value: 'TIFF_TO_PNG', label: 'TIFF to PNG', category: 'Image', isSupported: isTiff },
  { value: 'TIFF_TO_JPG', label: 'TIFF to JPG', category: 'Image', isSupported: isTiff },
  { value: 'TIFF_TO_PDF', label: 'TIFF to PDF', category: 'Document', isSupported: isTiff },

  { value: 'SVG_TO_PNG', label: 'SVG to PNG', category: 'Image', isSupported: isSvg },
  { value: 'SVG_TO_JPG', label: 'SVG to JPG', category: 'Image', isSupported: isSvg },
  { value: 'SVG_TO_WEBP', label: 'SVG to WebP', category: 'Image', isSupported: isSvg },
  
  // Data Matrix
  { value: 'JSON_TO_CSV', label: 'JSON to CSV', category: 'Data', isSupported: isJson },
  { value: 'JSON_TO_TSV', label: 'JSON to TSV', category: 'Data', isSupported: isJson },
  { value: 'JSON_TO_YAML', label: 'JSON to YAML', category: 'Data', isSupported: isJson },
  { value: 'JSON_TO_XML', label: 'JSON to XML', category: 'Data', isSupported: isJson },
  { value: 'JSON_TO_SQL', label: 'JSON to SQL', category: 'Data', isSupported: isJson },
  
  { value: 'CSV_TO_JSON', label: 'CSV to JSON', category: 'Data', isSupported: isCsv },
  { value: 'CSV_TO_TSV', label: 'CSV to TSV', category: 'Data', isSupported: isCsv },
  { value: 'CSV_TO_YAML', label: 'CSV to YAML', category: 'Data', isSupported: isCsv },
  { value: 'CSV_TO_XML', label: 'CSV to XML', category: 'Data', isSupported: isCsv },
  { value: 'CSV_TO_SQL', label: 'CSV to SQL', category: 'Data', isSupported: isCsv },
  
  { value: 'TSV_TO_JSON', label: 'TSV to JSON', category: 'Data', isSupported: isTsv },
  { value: 'TSV_TO_CSV', label: 'TSV to CSV', category: 'Data', isSupported: isTsv },

  { value: 'YAML_TO_JSON', label: 'YAML to JSON', category: 'Data', isSupported: isYaml },
  { value: 'YAML_TO_CSV', label: 'YAML to CSV', category: 'Data', isSupported: isYaml },
  { value: 'YAML_TO_XML', label: 'YAML to XML', category: 'Data', isSupported: isYaml },
  
  { value: 'XML_TO_JSON', label: 'XML to JSON', category: 'Data', isSupported: isXml },
  { value: 'XML_TO_CSV', label: 'XML to CSV', category: 'Data', isSupported: isXml },
  { value: 'XML_TO_YAML', label: 'XML to YAML', category: 'Data', isSupported: isXml },
  { value: 'XML_PRETTIFY', label: 'Prettify XML', category: 'Data', isSupported: isXml },
  { value: 'XML_MINIFY', label: 'Minify XML', category: 'Data', isSupported: isXml },

  { value: 'XLSX_TO_JSON', label: 'Excel to JSON', category: 'Data', isSupported: isXlsx },
  { value: 'XLSX_TO_CSV', label: 'Excel to CSV', category: 'Data', isSupported: isXlsx },
  
  { value: 'JSON_PRETTIFY', label: 'Prettify JSON', category: 'Data', isSupported: isJson },
  { value: 'JSON_MINIFY', label: 'Minify JSON', category: 'Data', isSupported: isJson },
  
  // Text & Code
  { value: 'MARKDOWN_TO_HTML', label: 'Markdown to HTML', category: 'Text', isSupported: isMd },
  { value: 'MARKDOWN_TO_PDF', label: 'Markdown to PDF', category: 'Document', isSupported: isMd },
  
  { value: 'HTML_TO_MARKDOWN', label: 'HTML to Markdown', category: 'Text', isSupported: isHtml },
  { value: 'HTML_TO_TEXT', label: 'HTML to Plain Text', category: 'Text', isSupported: isHtml },

  { value: 'DOCX_TO_HTML', label: 'Word to HTML', category: 'Document', isSupported: isDocx },
  { value: 'DOCX_TO_TEXT', label: 'Word to Text', category: 'Document', isSupported: isDocx },
  { value: 'DOCX_TO_MARKDOWN', label: 'Word to Markdown', category: 'Document', isSupported: isDocx },

  { value: 'TEXT_TO_PDF', label: 'Text to PDF', category: 'Document', isSupported: isText },
  { value: 'TEXT_UPPERCASE', label: 'ALL UPPERCASE', category: 'Text', isSupported: isText },
  { value: 'TEXT_LOWERCASE', label: 'all lowercase', category: 'Text', isSupported: isText },
  { value: 'TEXT_TO_SNAKE_CASE', label: 'snake_case', category: 'Text', isSupported: isText },
  { value: 'TEXT_TO_CAMEL_CASE', label: 'camelCase', category: 'Text', isSupported: isText },
  { value: 'URL_ENCODE', label: 'URL Encode', category: 'Utility', isSupported: isText },
  { value: 'URL_DECODE', label: 'URL Decode', category: 'Utility', isSupported: isText },
  { value: 'HTML_MINIFY', label: 'Minify HTML', category: 'Text', isSupported: isHtml },
  { value: 'CSS_MINIFY', label: 'Minify CSS', category: 'Text', isSupported: isCss },
  
  // Audio & Video
  { value: 'AUDIO_TO_MP3', label: 'Convert to MP3', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_WAV', label: 'Convert to WAV', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_M4A', label: 'Convert to M4A (AAC)', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_AAC', label: 'Convert to AAC', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_OGG', label: 'Convert to OGG', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_FLAC', label: 'Convert to FLAC', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_WEBM', label: 'Convert to WebM', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_OPUS', label: 'Convert to OPUS', category: 'Audio', isSupported: isAudio },
  { value: 'AUDIO_TO_M4R', label: 'Convert to M4R (Ringtone)', category: 'Audio', isSupported: isAudio },
  { value: 'VIDEO_TO_MP4', label: 'Convert to MP4', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_WEBM', label: 'Convert to WebM', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_MOV', label: 'Convert to MOV', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_MKV', label: 'Convert to MKV', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_AVI', label: 'Convert to AVI', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_TO_MP3', label: 'Extract Audio (MP3)', category: 'Video', isSupported: isVideo },
  { value: 'VIDEO_SNAPSHOT', label: 'Take Snapshot', category: 'Video', isSupported: isVideo },

  // 3D & CAD
  { value: 'OBJ_TO_STL', label: 'OBJ to STL', category: '3D', isSupported: is3d },
  { value: 'OBJ_TO_GLB', label: 'OBJ to GLB', category: '3D', isSupported: is3d },
  { value: 'OBJ_TO_USDZ', label: 'OBJ to USDZ (AR)', category: '3D', isSupported: is3d },
  { value: 'STL_TO_OBJ', label: 'STL to OBJ', category: '3D', isSupported: is3d },
  { value: 'STL_TO_GLB', label: 'STL to GLB', category: '3D', isSupported: is3d },
  { value: 'STL_TO_USDZ', label: 'STL to USDZ (AR)', category: '3D', isSupported: is3d },
  { value: 'GLB_TO_OBJ', label: 'GLB to OBJ', category: '3D', isSupported: is3d },
  { value: 'GLB_TO_STL', label: 'GLB to STL', category: '3D', isSupported: is3d },
  { value: 'GLB_TO_USDZ', label: 'GLB to USDZ (AR)', category: '3D', isSupported: is3d },
  { value: 'PLY_TO_OBJ', label: 'PLY to OBJ', category: '3D', isSupported: is3d },
  { value: 'PLY_TO_STL', label: 'PLY to STL', category: '3D', isSupported: is3d },
  { value: 'PLY_TO_GLB', label: 'PLY to GLB', category: '3D', isSupported: is3d },
  { value: 'MODEL_TO_IMAGE', label: '3D to PNG (Snapshot)', category: '3D', isSupported: is3d },

  // Fonts
  { value: 'FONT_TO_TTF', label: 'Convert to TTF', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_OTF', label: 'Convert to OTF', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_WOFF', label: 'Convert to WOFF', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_JSON', label: 'Extract Glyphs (JSON)', category: 'Font', isSupported: isFont },
  { value: 'FONT_TO_CSS', label: 'Generate CSS (@font-face)', category: 'Font', isSupported: isFont },

  // Document Utilities
  { value: 'PDF_TO_PNG', label: 'PDF to Image (PNG)', category: 'Document', isSupported: isPdf },

  // Utility
  { value: 'BASE64_ENCODE', label: 'Base64 Encode', category: 'Utility', isSupported: () => true },
  { value: 'BASE64_DECODE', label: 'Base64 Decode', category: 'Utility', isSupported: () => true },
  { value: 'FILE_TO_ZIP', label: 'Compress to ZIP', category: 'Utility', isSupported: () => true },
  { value: 'PASSTHROUGH', label: 'Original Format', category: 'Utility', isSupported: () => true },
];

export const ICONS = {
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M11 16V7.828l-3.414 3.414L6.172 9.828 12 4l5.828 5.828-1.414 1.414L13 7.828V16h-2zM4 18h16v2H4v-2z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm9 2v2H3v-2h18z" />
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  ),
  
  // Specific Type Icons - Sharp/Brutal Style
  
  Image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M21 3H3v18h18V3zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  ),
  
  Data: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M15 4v2h3v12h-3v2h5V4h-5zM4 20h5v-2H6V6h3V4H4v16z" />
    </svg>
  ),
  
  Document: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M14 2H4v20h16V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  ),
  
  Music: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V7h4V3h-7z" />
    </svg>
  ),
  
  Video: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17 10.5V6H3v12h14v-4.5l4 4v-11l-4 4z" />
    </svg>
  ),
  
  '3D': () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2l-9.5 5.5v9L12 22l9.5-5.5v-9L12 2zM5.5 8.68L12 5.12l6.5 3.56v7.12L12 19.32l-6.5-3.56V8.68zM12 13.5l4.5-2.5-4.5-2.5-4.5 2.5 4.5 2.5z" />
    </svg>
  ),

  Font: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z" />
    </svg>
  ),
  
  Utility: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
    </svg>
  )
};