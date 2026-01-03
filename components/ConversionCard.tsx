import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileItem, ConversionStatus, ConversionType } from '../types';
import { ICONS, CONVERSION_OPTIONS } from '../constants';
import { analyzeFileContent } from '../utils/geminiUtils';

interface ConversionCardProps {
  item: FileItem;
  onRemove: (id: string) => void;
  onConvert: (id: string) => void;
  onChangeType: (id: string, type: ConversionType) => void;
  onSuccessClick?: () => void;
}

const ConversionCardComponent: React.FC<ConversionCardProps> = ({ item, onRemove, onConvert, onChangeType, onSuccessClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isProcessing = item.status === ConversionStatus.PROCESSING;
  const isCompleted = item.status === ConversionStatus.COMPLETED;
  const isFailed = item.status === ConversionStatus.FAILED;
  const isIdle = item.status === ConversionStatus.IDLE;

  const displayExtension = (isCompleted && item.resultName) 
    ? item.resultName.split('.').pop() 
    : item.file.name.split('.').pop();

  const isAudioFile = item.file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|m4r|opus)$/i.test(item.file.name);
  const isVideoFile = item.file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(item.file.name);
  const isPdfFile = item.file.type === 'application/pdf' || item.file.name.toLowerCase().endsWith('.pdf');
  const is3dFile = /\.(obj|stl|glb|gltf|ply)$/i.test(item.file.name);
  const isFontFile = /\.(ttf|otf|woff|woff2)$/i.test(item.file.name);
  const isPresentationFile = item.file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || item.file.name.toLowerCase().endsWith('.pptx');

  const Icon3D = ICONS['3D'];

  const activePreviewUrl = (isCompleted && item.resultName?.match(/\.(png|jpe?g|webp|bmp|ico)$/i)) 
    ? item.resultUrl 
    : item.previewUrl;

  const selectedOption = CONVERSION_OPTIONS.find(opt => opt.value === item.type);

  const handleGetInsight = async () => {
    if (aiInsight || isAiLoading) return;
    setIsAiLoading(true);
    const insight = await analyzeFileContent(item.file);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  const availableOptions = useMemo(() => {
    return CONVERSION_OPTIONS.filter(opt => {
      if (!opt.isSupported(item.file)) return false;
      const name = item.file.name.toLowerCase();
      const parts = opt.value.split('_TO_');
      if (parts.length === 2) {
         const target = parts[1].toLowerCase();
         const targetExts: Record<string, string[]> = {
             'jpg': ['jpg', 'jpeg'], 'jpeg': ['jpg', 'jpeg'], 'png': ['png'],
             'webp': ['webp'], 'gif': ['gif'], 'bmp': ['bmp'],
             'tiff': ['tif', 'tiff'], 'tif': ['tif', 'tiff'], 'ico': ['ico'],
             'svg': ['svg'], 'mp3': ['mp3'], 'wav': ['wav'], 'pdf': ['pdf'],
             'html': ['html', 'htm'], 'markdown': ['md', 'markdown']
         };
         const checkList = targetExts[target] || [target];
         if (checkList.some(ext => name.endsWith('.' + ext))) return false;
      }
      return true;
    });
  }, [item.file]);

  const updateDropdownCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownCoords();
      window.addEventListener('scroll', updateDropdownCoords, true);
      window.addEventListener('resize', updateDropdownCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownCoords, true);
      window.removeEventListener('resize', updateDropdownCoords);
    };
  }, [isDropdownOpen, updateDropdownCoords]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDropdown = () => {
    if (!isDropdownOpen || !dropdownCoords) return null;
    return createPortal(
      <div 
        ref={dropdownRef}
        style={{ position: 'absolute', top: `${dropdownCoords.top + 4}px`, left: `${dropdownCoords.left}px`, width: `${dropdownCoords.width}px`, zIndex: 9999 }}
        className="bg-white dark:bg-zinc-900 neubrutal-border max-h-60 overflow-y-auto custom-scrollbar shadow-2xl"
        role="menu"
      >
        {availableOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChangeType(item.id, opt.value); setIsDropdownOpen(false); }}
            className={`w-full text-left p-2 px-3 text-[11px] font-black uppercase border-b last:border-b-0 border-black dark:border-white/20 ${item.type === opt.value ? 'bg-black text-brutalYellow' : 'text-black dark:text-white hover:bg-brutalYellow hover:text-black'}`}
            role="menuitem"
          >
            <div className="flex items-center justify-between w-full">
              <span>{opt.label}</span>
              <span className="text-[7px] opacity-40">{opt.category}</span>
            </div>
          </button>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 neubrutal-border p-2.5 group neubrutal-shadow-sm relative transition-all duration-150`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`w-10 h-10 flex-shrink-0 bg-brutalYellow neubrutal-border overflow-hidden flex items-center justify-center relative`}>
            {activePreviewUrl ? (
              <img src={activePreviewUrl} alt={`Preview of ${item.file.name}`} className="w-full h-full object-cover" />
            ) : isAudioFile ? (
               <div className="text-black"><ICONS.Music /></div>
            ) : isVideoFile ? (
               <div className="text-black"><ICONS.Video /></div>
            ) : (
              <span className="text-black text-[9px] font-black uppercase">{displayExtension}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-black text-black dark:text-white truncate uppercase tracking-tighter leading-none">
              {isCompleted ? item.resultName : item.file.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-[8px] font-black text-gray-700 dark:text-gray-300 uppercase">
                 {(item.file.size / 1024).toFixed(1)} KB
               </p>
               <button 
                 onClick={handleGetInsight}
                 className="text-[7px] font-black text-black bg-brutalYellow px-1 border border-black hover:scale-105 active:scale-95 transition-transform"
               >
                 {isAiLoading ? 'ANALYIZING...' : aiInsight ? 'INSIGHT READY' : 'AI INSIGHT'}
               </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onRemove(item.id)} 
          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-red-500 hover:text-white neubrutal-border neubrutal-shadow-sm neubrutal-button-active"
          disabled={isProcessing}
        >
          <ICONS.X />
        </button>
      </div>

      {aiInsight && (
        <div className="mt-2 p-1.5 bg-brutalYellow/10 border border-brutalYellow/40 text-[9px] font-bold text-black dark:text-white leading-tight uppercase italic">
          <span className="font-black text-brutalYellow bg-black px-1 mr-1">AI</span>
          {aiInsight}
        </div>
      )}

      <div className="mt-2.5 flex flex-col gap-2">
        {(isIdle || isProcessing) && (
          <div className="flex flex-col gap-1">
            <button
              ref={triggerRef}
              onClick={() => !isProcessing && setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full bg-white dark:bg-zinc-800 neubrutal-border text-[10px] font-black text-black dark:text-white uppercase p-1.5 px-2.5 flex items-center justify-between outline-none ${isProcessing ? 'cursor-not-allowed opacity-50' : 'hover:bg-brutalYellow hover:text-black'}`}
              disabled={isProcessing}
            >
              <span>{selectedOption?.label || 'Select Task'}</span>
              <ICONS.ChevronDown />
            </button>
            {renderDropdown()}
          </div>
        )}

        {isProcessing && (
          <div className="w-full bg-white dark:bg-zinc-900 neubrutal-border h-3 relative overflow-hidden">
            <div className="h-full bg-brutalYellow absolute top-0 left-0" style={{ width: `${item.progress}%` }} />
          </div>
        )}

        {isCompleted && (
          <div className="flex items-stretch gap-2">
            <div className="flex-1 bg-green-400 neubrutal-border p-1 text-[9px] font-black uppercase text-center">COMPLETE</div>
            <a href={item.resultUrl} download={item.resultName} className="p-1 px-3 text-[9px] font-black text-black bg-brutalYellow neubrutal-border neubrutal-shadow-sm flex items-center gap-1.5 uppercase">
              EXPORT <ICONS.Download />
            </a>
          </div>
        )}

        {isFailed && (
          <div className="bg-red-600 text-white p-1 text-[9px] font-black uppercase text-center">FAILED: {item.error}</div>
        )}
      </div>
    </div>
  );
};

export const ConversionCard = React.memo(ConversionCardComponent);