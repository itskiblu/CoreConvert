
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
 * These keys map directly to specific logic paths in App.tsx.
 */
export type ConversionType = 
  // Images
  | 'IMAGE_TO_PNG' 
  | 'IMAGE_TO_JPG' 
  | 'IMAGE_TO_WEBP' 
  | 'IMAGE_TO_AVIF'
  | 'IMAGE_TO_SVG'
  | 'IMAGE_TO_ICO'
  | 'IMAGE_TO_BMP'
  | 'HEIC_TO_PNG'
  | 'HEIC_TO_JPG'
  | 'IMAGE_GRAYSCALE'
  | 'SVG_TO_PNG'
  | 'SVG_TO_JPG'
  | 'SVG_TO_WEBP'
  | 'TIFF_TO_PNG'
  | 'TIFF_TO_JPG'
  | 'TIFF_TO_PDF'
  // Data Matrix
  | 'DATA_TO_JSON'
  | 'DATA_TO_CSV'
  | 'DATA_TO_YAML'
  | 'DATA_TO_XML'
  | 'JSON_TO_CSV'
  | 'JSON_TO_YAML'
  | 'JSON_TO_XML'
  | 'JSON_TO_SQL'
  | 'JSON_TO_TSV'
  | 'CSV_TO_JSON'
  | 'CSV_TO_YAML'
  | 'CSV_TO_XML'
  | 'CSV_TO_SQL'
  | 'CSV_TO_TSV'
  | 'YAML_TO_JSON'
  | 'YAML_TO_CSV'
  | 'YAML_TO_XML'
  | 'XML_TO_JSON'
  | 'XML_TO_CSV'
  | 'XML_TO_YAML'
  | 'TSV_TO_JSON'
  | 'TSV_TO_CSV'
  | 'XML_PRETTIFY'
  | 'XML_MINIFY'
  | 'XLSX_TO_JSON'
  | 'XLSX_TO_CSV'
  | 'JSON_PRETTIFY'
  | 'JSON_MINIFY'
  // Text & Code
  | 'MARKDOWN_TO_HTML'
  | 'HTML_TO_MARKDOWN'
  | 'HTML_TO_TEXT'
  | 'TEXT_UPPERCASE'
  | 'TEXT_LOWERCASE'
  | 'TEXT_TO_SNAKE_CASE'
  | 'TEXT_TO_CAMEL_CASE'
  | 'URL_ENCODE'
  | 'URL_DECODE'
  | 'HTML_MINIFY'
  | 'CSS_MINIFY'
  // Audio
  | 'AUDIO_TO_WAV'
  | 'AUDIO_TO_MP3'
  | 'AUDIO_TO_OGG'
  | 'AUDIO_TO_M4A'
  | 'AUDIO_TO_WEBM'
  | 'AUDIO_TO_FLAC'
  | 'AUDIO_TO_AAC'
  | 'AUDIO_TO_OPUS'
  | 'AUDIO_TO_M4R'
  // Video
  | 'VIDEO_TO_MP3'
  | 'VIDEO_TO_WEBM'
  | 'VIDEO_TO_MP4'
  | 'VIDEO_TO_MOV'
  | 'VIDEO_TO_MKV'
  | 'VIDEO_TO_AVI'
  | 'VIDEO_SNAPSHOT'
  // 3D & CAD
  | 'OBJ_TO_STL'
  | 'OBJ_TO_GLB'
  | 'OBJ_TO_USDZ'
  | 'STL_TO_OBJ'
  | 'STL_TO_GLB'
  | 'STL_TO_USDZ'
  | 'GLB_TO_OBJ'
  | 'GLB_TO_STL'
  | 'GLB_TO_USDZ'
  | 'PLY_TO_OBJ'
  | 'PLY_TO_STL'
  | 'PLY_TO_GLB'
  | 'MODEL_TO_IMAGE'
  // Fonts
  | 'FONT_TO_TTF'
  | 'FONT_TO_OTF'
  | 'FONT_TO_WOFF'
  | 'FONT_TO_JSON'
  | 'FONT_TO_CSS'
  // Documents
  | 'PDF_TO_PNG'
  | 'IMAGE_TO_PDF'
  | 'TEXT_TO_PDF'
  | 'MARKDOWN_TO_PDF'
  | 'DOCX_TO_HTML'
  | 'DOCX_TO_TEXT'
  | 'DOCX_TO_MARKDOWN'
  // Utilities
  | 'BASE64_ENCODE'
  | 'BASE64_DECODE'
  | 'FILE_TO_ZIP'
  | 'PASSTHROUGH'
  // AI Smart Tasks (Semantic Conversions)
  | 'AI_TEXT_TRANSFORM'
  | 'AI_IMAGE_TO_TEXT'
  | 'AI_TEXT_TO_AUDIO'
  | 'AI_AUDIO_TO_TEXT'
  | 'AI_VIDEO_TO_TEXT';

/**
 * The core data structure for a file card in the UI.
 * Contains both the original file and the result (if completed).
 */
export interface FileItem {
  id: string; // Unique identifier for React lists
  file: File; // The original input file object
  previewUrl?: string; // Blob URL for thumbnail generation
  status: ConversionStatus;
  progress: number; // 0 to 100 integer
  resultUrl?: string; // Blob URL for the converted file download
  resultName?: string; // Proposed filename for the download
  error?: string; // Error message if status === FAILED
  type: ConversionType; // The currently selected target conversion
  smartPrompt?: string; // For future AI capabilities
}

/**
 * Configuration object for filling the dropdown menus.
 */
export interface ConversionOption {
  value: ConversionType;
  label: string; // Display text
  category: 'Image' | 'Data' | 'Text' | 'Audio' | 'Video' | '3D' | 'Font' | 'Utility' | 'AI' | 'Document';
  isSupported: (file: File) => boolean; // Filter function to show relevant options only
}