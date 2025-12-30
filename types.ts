
export enum ConversionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export type ConversionType = 
  // Images
  | 'IMAGE_TO_PNG' 
  | 'IMAGE_TO_JPG' 
  | 'IMAGE_TO_WEBP' 
  | 'IMAGE_TO_SVG'
  | 'IMAGE_TO_ICO'
  | 'IMAGE_TO_BMP'
  | 'HEIC_TO_PNG'
  | 'HEIC_TO_JPG'
  | 'IMAGE_GRAYSCALE'
  | 'SVG_TO_PNG'
  | 'SVG_TO_JPG'
  | 'SVG_TO_WEBP'
  // Data Matrix
  | 'DATA_TO_JSON'
  | 'DATA_TO_CSV'
  | 'DATA_TO_YAML'
  | 'DATA_TO_XML'
  | 'JSON_TO_CSV'
  | 'JSON_TO_YAML'
  | 'JSON_TO_XML'
  | 'JSON_TO_SQL'
  | 'CSV_TO_JSON'
  | 'CSV_TO_YAML'
  | 'CSV_TO_XML'
  | 'CSV_TO_SQL'
  | 'YAML_TO_JSON'
  | 'YAML_TO_CSV'
  | 'YAML_TO_XML'
  | 'XML_TO_JSON'
  | 'XML_TO_CSV'
  | 'XML_TO_YAML'
  | 'XLSX_TO_JSON'
  | 'XLSX_TO_CSV'
  | 'JSON_PRETTIFY'
  | 'JSON_MINIFY'
  // Text & Code
  | 'MARKDOWN_TO_HTML'
  | 'TEXT_UPPERCASE'
  | 'TEXT_LOWERCASE'
  | 'TEXT_TO_SNAKE_CASE'
  | 'TEXT_TO_CAMEL_CASE'
  | 'HTML_MINIFY'
  | 'CSS_MINIFY'
  // Audio
  | 'AUDIO_TO_WAV'
  | 'AUDIO_TO_MP3'
  // Video
  | 'VIDEO_TO_MP3'
  | 'VIDEO_TO_WEBM'
  | 'VIDEO_TO_MP4'
  | 'VIDEO_TO_MOV'
  | 'VIDEO_TO_MKV'
  | 'VIDEO_TO_AVI'
  | 'VIDEO_SNAPSHOT'
  // Documents
  | 'PDF_TO_PNG'
  | 'IMAGE_TO_PDF'
  | 'TEXT_TO_PDF'
  | 'MARKDOWN_TO_PDF'
  // Utilities
  | 'BASE64_ENCODE'
  | 'FILE_TO_ZIP'
  | 'PASSTHROUGH'
  // AI Smart Tasks (Semantic Conversions)
  | 'AI_TEXT_TRANSFORM'
  | 'AI_IMAGE_TO_TEXT'
  | 'AI_TEXT_TO_AUDIO'
  | 'AI_AUDIO_TO_TEXT'
  | 'AI_VIDEO_TO_TEXT';

export interface FileItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: ConversionStatus;
  progress: number;
  resultUrl?: string;
  resultName?: string;
  error?: string;
  type: ConversionType;
  smartPrompt?: string; // For AI tasks
}

export interface ConversionOption {
  value: ConversionType;
  label: string;
  category: 'Image' | 'Data' | 'Text' | 'Audio' | 'Video' | 'Utility' | 'AI' | 'Document';
  isSupported: (file: File) => boolean;
}
