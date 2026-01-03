

/**
 * Represents the current lifecycle state of a file within the application.
 * IDLE: File added but not started.
 * PROCESSING: Currently being converted.
 * COMPLETED: Conversion successful, download ready.
 * FAILED: Error occurred during processing.
 */
export enum ConversionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Union type representing all supported conversion operations.
 * Refactored to be Input-Agnostic.
 * e.g. 'IMAGE_TO_PNG' handles JPG, HEIC, PSD, TIFF, etc. as inputs.
 */
export type ConversionType = 
  // Images (Universal Inputs: PNG, JPG, WEBP, AVIF, HEIC, TIFF, PSD, RAW, SVG, BMP, ICO)
  | 'IMAGE_TO_PNG' 
  | 'IMAGE_TO_JPG' 
  | 'IMAGE_TO_WEBP' 
  | 'IMAGE_TO_AVIF'
  | 'IMAGE_TO_SVG'
  | 'IMAGE_TO_ICO'
  | 'IMAGE_TO_BMP'
  | 'IMAGE_TO_GIF'
  | 'IMAGE_TO_TIFF'
  | 'IMAGE_TO_CUR'
  | 'IMAGE_TO_PDF'
  | 'IMAGE_GRAYSCALE'
  | 'IMAGE_TO_DESCRIPTION' // AI Feature
  
  // Data (Universal Inputs: JSON, CSV, TSV, YAML, XML, XLSX, SQL)
  | 'DATA_TO_JSON'
  | 'DATA_TO_CSV'
  | 'DATA_TO_YAML'
  | 'DATA_TO_XML'
  | 'DATA_TO_SQL'
  | 'DATA_TO_TSV'
  | 'DATA_TO_XLSX'
  | 'DATA_PRETTIFY'
  | 'DATA_MINIFY'

  // Text & Markup
  | 'TEXT_TO_HTML'
  | 'TEXT_TO_MARKDOWN'
  | 'TEXT_TO_PLAIN'
  | 'TEXT_TO_PDF'
  | 'TEXT_TO_PPTX'
  | 'MARKDOWN_TO_PPTX'
  | 'TEXT_UPPERCASE'
  | 'TEXT_LOWERCASE'
  | 'TEXT_TO_SNAKE_CASE'
  | 'TEXT_TO_CAMEL_CASE'
  | 'URL_ENCODE'
  | 'URL_DECODE'
  | 'HTML_MINIFY'
  | 'CSS_MINIFY'
  | 'TEXT_TO_SUMMARY' // AI Feature

  // Specific Documents
  | 'DOCX_TO_HTML'
  | 'DOCX_TO_TEXT'
  | 'DOCX_TO_MARKDOWN'

  // Presentations (Universal Inputs: PPTX, PPTM, PPSX, POTX, etc)
  | 'PRESENTATION_TO_PDF'
  | 'PRESENTATION_TO_HTML'
  | 'PRESENTATION_TO_TEXT'
  | 'PRESENTATION_TO_JSON'
  | 'PRESENTATION_TO_PPTX'

  // Audio
  | 'AUDIO_TO_MP3'
  | 'AUDIO_TO_WAV'
  | 'AUDIO_TO_M4A'
  | 'AUDIO_TO_AAC'
  | 'AUDIO_TO_OGG'
  | 'AUDIO_TO_FLAC'
  | 'AUDIO_TO_WEBM'
  | 'AUDIO_TO_OPUS'
  | 'AUDIO_TO_M4R'

  // Video
  | 'VIDEO_TO_MP4'
  | 'VIDEO_TO_WEBM'
  | 'VIDEO_TO_MOV'
  | 'VIDEO_TO_MKV'
  | 'VIDEO_TO_AVI'
  | 'VIDEO_TO_MP3'
  | 'VIDEO_SNAPSHOT'

  // 3D
  | 'MODEL_TO_STL'
  | 'MODEL_TO_OBJ'
  | 'MODEL_TO_GLB'
  | 'MODEL_TO_USDZ'
  | 'MODEL_TO_IMAGE'

  // Fonts
  | 'FONT_TO_TTF'
  | 'FONT_TO_OTF'
  | 'FONT_TO_WOFF'
  | 'FONT_TO_JSON'
  | 'FONT_TO_CSS'

  // Utilities
  | 'PDF_TO_PNG'
  | 'BASE64_ENCODE'
  | 'BASE64_DECODE'
  | 'FILE_TO_ZIP'
  | 'PASSTHROUGH';

export interface FileItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: ConversionStatus;
  progress: number;
  type: ConversionType;
  resultUrl?: string;
  resultName?: string;
  error?: string;
}

export interface ConversionOption {
  value: ConversionType;
  label: string;
  category: 'Image' | 'Data' | 'Text' | 'Document' | 'Presentation' | 'Audio' | 'Video' | '3D' | 'Font' | 'Utility' | 'AI';
  isSupported: (file: File) => boolean;
}