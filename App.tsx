
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileItem, ConversionStatus, ConversionType } from './types';
import { 
  CONVERSION_OPTIONS, 
  ICONS, 
  isImage, 
  isPdf, 
  isAudio, 
  isVideo, 
  is3d, 
  isFont, 
  isData, 
  isTextAndMarkup,
  isDocx,
  isPresentation,
} from './constants';
import { convertImageFile } from './utils/imageUtils';
import { convertDocumentFile } from './utils/pdfUtils';
import { convertDataFile } from './utils/dataUtils';
import { convertPresentationFile } from './utils/presentationUtils';
import { convertAudioFile } from './utils/audioUtils';
import { convertVideoFile } from './utils/videoUtils';
import { convertModelFile } from './utils/modelUtils';
import { convertFontFile } from './utils/fontUtils';

import { ConversionCard } from './components/ConversionCard';
import { PrivacyContent } from './components/PrivacyContent';
import { TermsContent } from './components/TermsContent';
import { AboutContent } from './components/AboutContent';
import { DiagnosticsContent } from './components/DiagnosticsContent';

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
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'about' | 'diagnostics'>('home');
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

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

  // Focus management for modal
  useEffect(() => {
    if (unsupportedFileName) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus modal after render
      setTimeout(() => {
        const focusable = modalRef.current?.querySelector('button');
        if (focusable) (focusable as HTMLElement).focus();
      }, 50);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [unsupportedFileName]);

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

      // Detection Logic
      const fileIsImage = isImage(file);
      const fileIsData = isData(file);
      const fileIsText = isTextAndMarkup(file);
      const fileIsAudio = isAudio(file);
      const fileIsVideo = isVideo(file);
      const fileIs3d = is3d(file);
      const fileIsFont = isFont(file);
      const fileIsPdf = isPdf(file);
      const fileIsDocx = isDocx(file);
      const fileIsPresentation = isPresentation(file);

      const isRecognized = fileIsImage || fileIsData || fileIsText || fileIsAudio || fileIsVideo || fileIs3d || fileIsFont || fileIsPdf || fileIsDocx || fileIsPresentation;

      if (!isRecognized) {
        setUnsupportedFileName(file.name);
        continue;
      }
      
      let defaultType: ConversionType = 'PASSTHROUGH';
      let previewUrl: string | undefined = undefined;

      // Determine default conversion suggestion based on category logic
      if (fileIsImage) {
        // Default to PNG, unless input is PNG, then JPG
        if (mime === 'image/png' || name.endsWith('.png')) {
           defaultType = 'IMAGE_TO_JPG';
        } else {
           defaultType = 'IMAGE_TO_PNG';
        }
        
        // Show preview for browsers that support the format directly
        if (!name.endsWith('.heic') && !name.endsWith('.tiff') && !name.endsWith('.psd') && !name.endsWith('.raw')) {
           previewUrl = URL.createObjectURL(file);
        }
      }
      else if (fileIsData) {
        // Data rotation: JSON -> CSV -> JSON
        if (name.endsWith('.csv') || mime === 'text/csv') defaultType = 'DATA_TO_JSON';
        else defaultType = 'DATA_TO_CSV';
      }
      else if (fileIsDocx) {
        defaultType = 'DOCX_TO_HTML';
      }
      else if (fileIsPresentation) {
        defaultType = 'PRESENTATION_TO_PDF';
      }
      else if (fileIsText) {
        // Text rotation
        if (name.endsWith('.md')) defaultType = 'TEXT_TO_HTML';
        else if (name.endsWith('.html')) defaultType = 'TEXT_TO_MARKDOWN';
        else defaultType = 'TEXT_TO_PDF';
      }
      else if (fileIsAudio) {
        const isMp3 = mime === 'audio/mpeg' || name.endsWith('.mp3');
        defaultType = isMp3 ? 'AUDIO_TO_WAV' : 'AUDIO_TO_MP3';
      }
      else if (fileIsVideo) {
        const isMp4 = mime === 'video/mp4' || name.endsWith('.mp4');
        defaultType = isMp4 ? 'VIDEO_TO_WEBM' : 'VIDEO_TO_MP4';
      }
      else if (fileIs3d) {
        const isStl = name.endsWith('.stl');
        defaultType = isStl ? 'MODEL_TO_OBJ' : 'MODEL_TO_STL';
      }
      else if (fileIsFont) {
        const isTtf = name.endsWith('.ttf');
        defaultType = isTtf ? 'FONT_TO_WOFF' : 'FONT_TO_TTF';
      }
      else if (fileIsPdf) {
        defaultType = 'PDF_TO_PNG';
      }

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
    const item = filesRef.current.find(f => f.id === id);
    if (!item || item.status === ConversionStatus.PROCESSING) return;

    // Reset progress and set status
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ConversionStatus.PROCESSING, progress: 0 } : f));

    // Simulate progress: Increment every 20ms (50fps) for very smooth feedback
    const intervalId = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === id && f.status === ConversionStatus.PROCESSING) {
          // Cap at 95% so it never finishes before the actual process
          const target = 95;
          if (f.progress >= target) return f;

          // Asymptotic approach to target
          const remaining = target - f.progress;
          // Slow down as we get closer to 95%
          const increment = Math.max(0.1, remaining * 0.05);
          
          return { ...f, progress: Math.min(target, f.progress + increment) };
        }
        return f;
      }));
    }, 20);

    try {
      let result = null;
      const type = item.type;
      
      // Allow initial render cycle to update UI before heavy work
      await new Promise(r => setTimeout(r, 10));
      
      // Route based on category
      if (type.startsWith('IMAGE_')) {
         result = await convertImageFile(item.file, type);
      } else if (
        type.startsWith('DOCX_') ||
        type.startsWith('TEXT_') ||
        type.startsWith('PDF_')
      ) {
        result = await convertDocumentFile(item.file, type);
      } else if (type.startsWith('DATA_')) {
        result = await convertDataFile(item.file, type);
      } else if (type.startsWith('PRESENTATION_')) {
        result = await convertPresentationFile(item.file, type);
      } else if (type.startsWith('AUDIO_')) {
        result = await convertAudioFile(item.file, type);
      } else if (type.startsWith('VIDEO_')) {
        result = await convertVideoFile(item.file, type);
      } else if (type.startsWith('MODEL_')) {
        result = await convertModelFile(item.file, type);
      } else if (type.startsWith('FONT_')) {
        result = await convertFontFile(item.file, type);
      } else {
        // Fallback for types not yet fully implemented in this update
        await new Promise(r => setTimeout(r, 1000)); // Simulating work
        result = {
          url: URL.createObjectURL(item.file),
          name: `converted_${item.file.name}`,
          blob: item.file
        };
      }

      clearInterval(intervalId);

      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: ConversionStatus.COMPLETED, 
        progress: 100,
        resultUrl: result.url,
        resultName: result.name,
      } : f));

    } catch (error) {
      clearInterval(intervalId);
      console.error(error);
      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: ConversionStatus.FAILED, 
        progress: 0,
        error: (error as Error).message
      } : f));
      triggerNotification('alert');
    }

  }, [triggerNotification]);

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
      // @ts-ignore - Dynamically loaded to reduce initial bundle size
      const JSZip = (await import('jszip')).default;
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
    if (files.length === 0) return { label: 'IDLE', color: 'text-gray-600 dark:text-gray-400' };
    if (files.some(f => f.status === ConversionStatus.PROCESSING)) return { label: 'BUSY', color: 'text-brutalYellow' };
    if (files.every(f => f.status === ConversionStatus.COMPLETED || f.status === ConversionStatus.FAILED)) return { label: 'DONE', color: 'text-green-600 dark:text-green-400' };
    return { label: 'READY', color: 'text-blue-600 dark:text-blue-300' };
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

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === 'Escape') setUnsupportedFileName(null);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      {/* Unsupported File Modal Overlay */}
      {unsupportedFileName && (
        <div 
          ref={modalRef}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="unsupported-modal-title"
          aria-describedby="unsupported-modal-desc"
          onKeyDown={handleModalKeyDown}
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
               <span className="text-white font-black text-2xl" aria-hidden="true">!</span>
            </button>
            <h3 id="unsupported-modal-title" className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Unsupported Type</h3>
            <p id="unsupported-modal-desc" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-6 uppercase leading-tight">
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
          aria-label="Go to Home"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-black flex items-center justify-center text-brutalYellow flex-shrink-0" aria-hidden="true">
             <div className="w-5 h-5 md:w-6 md:h-6 border-[3px] border-brutalYellow"></div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tighter uppercase leading-none">CORECONVERT</h1>
        </a>
        
        <div className="flex items-center gap-3 md:gap-4 h-9 md:h-10">
          <div 
            role="status"
            className="h-full bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow-sm px-3 md:px-4 flex items-center font-black text-[10px] md:text-xs uppercase text-black dark:text-white"
          >
            STATUS: <span className={`ml-1 ${globalStatus.color}`}>{globalStatus.label}</span>
          </div>

          <button 
            onClick={toggleTheme}
            className="h-full px-3 md:px-4 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black neubrutal-border neubrutal-shadow-sm flex items-center justify-center font-black text-[10px] md:text-xs uppercase neubrutal-button-active flex-shrink-0 outline-none"
            aria-pressed={isDarkMode}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          {currentView === 'home' && (
            <button 
              onClick={() => setFiles([])}
              className="h-full px-3 md:px-4 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-red-500 hover:text-white dark:hover:bg-red-600 neubrutal-border neubrutal-shadow-sm flex items-center justify-center font-black text-[10px] md:text-xs uppercase neubrutal-button-active flex-shrink-0 outline-none"
              aria-label="Reset all files and start over"
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
          <section className="w-full max-w-[480px] flex flex-col" aria-label="Input Files">
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
                  <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />
                  
                  {inputFiles.length === 0 ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center p-6 text-center outline-none neubrutal-trigger"
                      aria-label="Click to select files or drag and drop them here"
                    >
                      <div className="w-14 h-14 bg-black dark:bg-white text-brutalYellow dark:text-black mb-5 neubrutal-border neubrutal-shadow-sm flex items-center justify-center neubrutal-target" aria-hidden="true">
                        <ICONS.Upload />
                      </div>
                      <p className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Click or Drag Files</p>
                      <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 mt-1.5 uppercase tracking-[0.2em]">Local Browser Processing</p>
                    </button>
                  ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                      <div className="shrink-0 mb-3 px-2 py-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 p-2.5 bg-brutalYellow text-black neubrutal-border neubrutal-shadow-sm neubrutal-button-active cursor-pointer outline-none"
                        >
                          <div className="w-5 h-5 flex items-center justify-center scale-75" aria-hidden="true">
                            <ICONS.Upload />
                          </div>
                          <span className="font-black text-xs uppercase tracking-widest leading-none">Add More Files</span>
                        </button>
                      </div>
                      <ul className="flex-1 min-h-0 px-2 pb-3 space-y-3 overflow-y-auto custom-scrollbar list-none m-0">
                        {inputFiles.map(item => (
                          <li key={item.id}>
                            <ConversionCard 
                              item={item} 
                              onRemove={removeFile}
                              onConvert={processConversion}
                              onChangeType={updateFileType}
                              onSuccessClick={onSuccessClick}
                            />
                          </li>
                        ))}
                      </ul>
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
               <div className="bg-black dark:bg-white text-brutalYellow dark:text-black p-4 md:p-5 neubrutal-shadow-sm neubrutal-target" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 rotate-90 lg:rotate-0">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                  </svg>
               </div>
             </button>
          </div>

          {/* OUTPUT COLUMN */}
          <section className="w-full max-w-[480px] flex flex-col" aria-label="Output Files">
            <div className="flex items-center gap-3 mb-3 justify-end">
              {completedCount > 1 && (
                <button 
                  onClick={downloadAll}
                  disabled={isZipping}
                  className="bg-brutalYellow text-black px-3 py-1.5 font-black text-[10px] tracking-tighter uppercase neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex items-center gap-1.5 disabled:opacity-50 outline-none"
                >
                  {isZipping ? 'ZIPPING...' : `Export All (${completedCount})`} 
                  {!isZipping && <div className="scale-75" aria-hidden="true"><ICONS.Download /></div>}
                </button>
              )}
              <h2 className="bg-black dark:bg-white text-white dark:text-black px-5 py-1.5 font-black text-lg tracking-[0.15em] uppercase neubrutal-shadow-sm">
                OUTPUT
              </h2>
            </div>
            
            <div className="w-full relative pt-[100%]">
              <div className="absolute inset-0 bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow flex flex-col p-3 md:p-4">
                <div className="flex-1 min-h-0 px-1 overflow-y-auto custom-scrollbar">
                  {outputFiles.length > 0 ? (
                    <ul className="space-y-3 list-none m-0 p-0">
                      {outputFiles.map(item => (
                        <li key={item.id}>
                          <ConversionCard 
                            item={item} 
                            onRemove={removeFile}
                            onConvert={processConversion}
                            onChangeType={updateFileType}
                            onSuccessClick={onSuccessClick}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 font-black uppercase tracking-tighter italic text-center p-8 text-sm">
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
      
      {currentView === 'diagnostics' && (
        <main className="flex-1">
          <DiagnosticsContent onBack={() => setCurrentView('home')} />
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
            <p className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight max-w-sm md:max-w-none">
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
              <button 
                onClick={() => setCurrentView('diagnostics')}
                className={getLinkClass('diagnostics')}
              >
                System Check
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
              <span className="text-white font-black text-2xl" aria-hidden="true">!</span>
            ) : (
              <div className="scale-150 flex items-center justify-center" aria-hidden="true">
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
