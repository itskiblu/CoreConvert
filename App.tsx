
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileItem, ConversionStatus, ConversionType } from './types';
import { 
  CONVERSION_OPTIONS, 
  ICONS, 
  isImage, 
  isPdf, 
  isAudio, 
  isVideo, 
  isData, 
  isTextAndMarkup,
  isDocx,
} from './constants';

import { ConversionCard } from './components/ConversionCard';
import { PrivacyContent } from './components/PrivacyContent';
import { TermsContent } from './components/TermsContent';
import { AboutContent } from './components/AboutContent';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'about'>('home');
  const [files, setFiles] = useState<FileItem[]>([]);
  const filesRef = useRef<FileItem[]>(files);
  const [isZipping, setIsZipping] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: string}[]>([]);

  useEffect(() => { filesRef.current = files; }, [files]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('core-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('core-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const validFiles: FileItem[] = selectedFiles.map(file => {
      let defaultType: ConversionType = 'PASSTHROUGH';
      if (isImage(file)) defaultType = 'IMAGE_TO_PNG';
      else if (isData(file)) defaultType = 'DATA_TO_JSON';
      else if (isPdf(file)) defaultType = 'AI_SUMMARIZE'; // Suggest AI for PDFs
      else if (isAudio(file)) defaultType = 'AUDIO_TO_MP3';

      return {
        id: Math.random().toString(36).substring(7),
        file,
        status: ConversionStatus.IDLE,
        progress: 0,
        type: defaultType
      };
    });
    setFiles(prev => [...prev, ...validFiles]);
  };

  const processConversion = useCallback(async (id: string) => {
    const item = filesRef.current.find(f => f.id === id);
    if (!item) return;

    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ConversionStatus.PROCESSING, progress: 10 } : f));

    try {
      let result;
      if (item.type.startsWith('AI_')) {
        const { convertWithAI } = await import('./utils/aiUtils');
        result = await convertWithAI(item.file, item.type);
      } else if (item.type.startsWith('IMAGE_')) {
        const { convertImageFile } = await import('./utils/imageUtils');
        result = await convertImageFile(item.file, item.type);
      } else if (item.type.startsWith('DATA_')) {
        const { convertDataFile } = await import('./utils/dataUtils');
        result = await convertDataFile(item.file, item.type);
      } else {
        const { convertDocumentFile } = await import('./utils/pdfUtils');
        result = await convertDocumentFile(item.file, item.type);
      }

      setFiles(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status: ConversionStatus.COMPLETED, 
        progress: 100,
        resultUrl: result.url,
        resultName: result.name 
      } : f));
    } catch (err) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ConversionStatus.FAILED, error: (err as Error).message } : f));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 bg-brutalYellow neubrutal-border neubrutal-shadow p-3 md:p-4 outline-none">
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tighter uppercase leading-none">CORECONVERT AI</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="h-10 px-4 bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow-sm font-black text-xs uppercase">
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-10 items-center justify-center">
        <section className="w-full max-w-[480px]">
          <h2 className="bg-black dark:bg-white text-white dark:text-black px-5 py-1.5 font-black text-lg uppercase mb-4 inline-block">Input</h2>
          <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-4 min-h-[300px]">
            <input type="file" multiple onChange={handleFileChange} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="w-full h-full border-2 border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center p-10 cursor-pointer hover:bg-brutalYellow/5 transition-colors">
              <ICONS.Upload />
              <p className="mt-4 font-black uppercase text-sm">Click to add files</p>
            </label>
            <ul className="mt-4 space-y-2">
              {files.filter(f => f.status === ConversionStatus.IDLE).map(item => (
                <ConversionCard key={item.id} item={item} onRemove={id => setFiles(prev => prev.filter(f => f.id !== id))} onConvert={processConversion} onChangeType={(id, type) => setFiles(prev => prev.map(f => f.id === id ? {...f, type} : f))} />
              ))}
            </ul>
          </div>
        </section>

        <div className="shrink-0">
          <button onClick={() => files.filter(f => f.status === ConversionStatus.IDLE).forEach(f => processConversion(f.id))} className="bg-black dark:bg-white text-brutalYellow dark:text-black p-6 neubrutal-shadow neubrutal-button-active">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" /></svg>
          </button>
        </div>

        <section className="w-full max-w-[480px]">
          <h2 className="bg-black dark:bg-white text-white dark:text-black px-5 py-1.5 font-black text-lg uppercase mb-4 inline-block">Output</h2>
          <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-4 min-h-[300px]">
            <ul className="space-y-2">
              {files.filter(f => f.status !== ConversionStatus.IDLE).map(item => (
                <ConversionCard key={item.id} item={item} onRemove={id => setFiles(prev => prev.filter(f => f.id !== id))} onConvert={processConversion} onChangeType={() => {}} />
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
