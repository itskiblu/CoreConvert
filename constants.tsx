
import React from 'react';
import { ConversionOption } from './types';

// --- File Type Detectors ---
export const isImage = (f: File) => {
  const name = f.name.toLowerCase();
  const type = f.type.toLowerCase();
  return type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif|bmp|ico|cur|tiff?|heic|heif|svg|psd|ai|eps|dng|cr2|nef|arw)$/i.test(name);
};

export const isData = (f: File) => {
  const name = f.name.toLowerCase();
  const type = f.type.toLowerCase();
  return type === 'application/json' || type === 'text/csv' || type.includes('xml') || /\.(json|csv|tsv|xml|yaml|yml|xlsx|xls|sql)$/i.test(name);
};

export const isTextAndMarkup = (f: File) => {
  const name = f.name.toLowerCase();
  return (f.type.startsWith('text/') || /\.(txt|md|markdown|html|htm|css|js|jsx|ts|tsx|log|ini|conf|sh|bat)$/i.test(name)) && !isData(f);
};

export const isAudio = (f: File) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|m4r|opus)$/i.test(f.name);
export const isVideo = (f: File) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name);
export const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

// --- Conversion Options ---
export const CONVERSION_OPTIONS: ConversionOption[] = [
  // ... (previous options kept)
  { value: 'IMAGE_TO_PNG', label: 'Convert to PNG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_JPG', label: 'Convert to JPG', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_WEBP', label: 'Convert to WebP', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_AVIF', label: 'Convert to AVIF', category: 'Image', isSupported: isImage },
  { value: 'IMAGE_TO_SVG', label: 'Convert to SVG', category: 'Image', isSupported: isImage },
  
  { value: 'DATA_TO_JSON', label: 'Convert to JSON', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_CSV', label: 'Convert to CSV', category: 'Data', isSupported: isData },
  { value: 'DATA_TO_YAML', label: 'Convert to YAML', category: 'Data', isSupported: isData },
  
  { value: 'TEXT_TO_PDF', label: 'Convert to PDF', category: 'Document', isSupported: isTextAndMarkup },
  { value: 'TEXT_TO_HTML', label: 'Convert to HTML', category: 'Text', isSupported: isTextAndMarkup },
  
  { value: 'AUDIO_TO_MP3', label: 'Convert to MP3', category: 'Audio', isSupported: isAudio },
  { value: 'VIDEO_SNAPSHOT', label: 'Take Snapshot', category: 'Video', isSupported: isVideo },

  // --- AI SMART TOOLS ---
  { value: 'AI_SUMMARIZE', label: 'AI: Summarize Content', category: 'Smart AI', isSupported: (f) => isPdf(f) || isTextAndMarkup(f) },
  { value: 'AI_TRANSLATE_EN', label: 'AI: Translate to English', category: 'Smart AI', isSupported: (f) => isTextAndMarkup(f) || isData(f) },
  { value: 'AI_DESCRIBE_IMAGE', label: 'AI: Describe Image', category: 'Smart AI', isSupported: isImage },
  { value: 'AI_DATA_TO_CODE', label: 'AI: JSON to TypeScript', category: 'Smart AI', isSupported: (f) => f.name.endsWith('.json') },
  { value: 'AI_TRANSCRIPT', label: 'AI: Audio Transcription', category: 'Smart AI', isSupported: isAudio },
  
  { value: 'FILE_TO_ZIP', label: 'Compress to ZIP', category: 'Utility', isSupported: () => true },
  { value: 'PASSTHROUGH', label: 'Original Format', category: 'Utility', isSupported: () => true },
];

export const ICONS = {
  Upload: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M11 16V7.828l-3.414 3.414L6.172 9.828 12 4l5.828 5.828-1.414 1.414L13 7.828V16h-2zM4 18h16v2H4v-2z" /></svg>,
  Check: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>,
  Download: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 16l-5-5h3V4h4v7h3l-5 5zm9 2v2H3v-2h18z" /></svg>,
  X: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>,
  ChevronDown: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M7 10l5 5 5-5H7z" /></svg>,
  SmartAI: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zM13.33 11.7l-1.41-1.41 1.41-1.41 1.41 1.41-1.41 1.41z" /></svg>,
  Image: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M21 3H3v18h18V3zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>,
  Data: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M15 4v2h3v12h-3v2h5V4h-5zM4 20h5v-2H6V6h3V4H4v16z" /></svg>,
  Document: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M14 2H4v20h16V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>,
  Music: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V7h4V3h-7z" /></svg>,
  Video: () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17 10.5V6H3v12h14v-4.5l4 4v-11l-4 4z" /></svg>,
};
