

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileItem, ConversionStatus, ConversionType } from '../types';
import { ICONS, CONVERSION_OPTIONS } from '../constants';

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

  // Helper for 3D icon which has a special key
  const Icon3D = ICONS['3D'];

  const activePreviewUrl = (isCompleted && item.resultName?.match(/\.(png|jpe?g|webp|bmp|ico)$/i)) 
    ? item.resultUrl 
    : item.previewUrl;

  const selectedOption = CONVERSION_OPTIONS.find(opt => opt.value === item.type);

  const availableOptions = useMemo(() => {
    return CONVERSION_OPTIONS.filter(opt => {
      // 1. Basic category support check
      if (!opt.isSupported(item.file)) return false;

      const name = item.file.name.toLowerCase();
      const mime = item.file.type.toLowerCase();
      
      // 2. Generic Self-Conversion Check (Hide "PNG to PNG")
      const parts = opt.value.split('_TO_');
      if (parts.length === 2) {
         const target = parts[1].toLowerCase();
         // Normalize extensions for comparison
         const targetExts: Record<string, string[]> = {
             'jpg': ['jpg', 'jpeg'],
             'jpeg': ['jpg', 'jpeg'],
             'png': ['png'],
             'webp': ['webp'],
             'gif': ['gif'],
             'bmp': ['bmp'],
             'tiff': ['tif', 'tiff'],
             'tif': ['tif', 'tiff'],
             'ico': ['ico'],
             'svg': ['svg'],
             'mp3': ['mp3'],
             'wav': ['wav'],
             'ogg': ['ogg'],
             'flac': ['flac'],
             'm4a': ['m4a'],
             'aac': ['aac'],
             'opus': ['opus'],
             'mp4': ['mp4', 'm4v'],
             'webm': ['webm'],
             'mov': ['mov'],
             'mkv': ['mkv'],
             'avi': ['avi'],
             'json': ['json'],
             'csv': ['csv'],
             'xml': ['xml'],
             'yaml': ['yaml', 'yml'],
             'yml': ['yaml', 'yml'],
             'tsv': ['tsv'],
             'pdf': ['pdf'],
             'html': ['html', 'htm'],
             'htm': ['html', 'htm'],
             'markdown': ['md', 'markdown'],
             'md': ['md', 'markdown'],
             'stl': ['stl'],
             'obj': ['obj'],
             'glb': ['glb'],
             'ttf': ['ttf'],
             'otf': ['otf'],
             'woff': ['woff'],
             'sql': ['sql'],
             'xlsx': ['xlsx', 'xls']
         };
         
         const checkList = targetExts[target] || [target];
         // If file name ends with any of the target extensions, hide it
         if (checkList.some(ext => name.endsWith('.' + ext))) return false;
      }

      // 3. Category logic removed - relying on isSupported check in step 1 which is the single source of truth.

      return true;
    });
  }, [item.file, item.resultName, isCompleted, isPdfFile]);

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
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
        triggerRef.current?.focus();
    }
  };

  const renderDropdown = () => {
    if (!isDropdownOpen || !dropdownCoords) return null;

    return createPortal(
      <div 
        ref={dropdownRef}
        style={{ 
          position: 'absolute', 
          top: `${dropdownCoords.top + 4}px`, 
          left: `${dropdownCoords.left}px`, 
          width: `${dropdownCoords.width}px`,
          zIndex: 9999 
        }}
        className="bg-white dark:bg-zinc-900 neubrutal-border max-h-60 overflow-y-auto custom-scrollbar shadow-2xl"
        role="menu"
      >
        {availableOptions.length > 0 ? availableOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onChangeType(item.id, opt.value);
              setIsDropdownOpen(false);
              triggerRef.current?.focus();
            }}
            className={`w-full text-left p-2 px-3 text-[11px] font-black uppercase border-b last:border-b-0 border-black dark:border-white/20
              ${item.type === opt.value 
                ? 'bg-black text-brutalYellow' 
                : 'text-black dark:text-white hover:bg-brutalYellow hover:text-black dark:hover:bg-brutalYellow dark:hover:text-black'
              }`}
            role="menuitem"
          >
            <div className="flex items-center justify-between w-full">
              <span>{opt.label}</span>
              <span className="text-[7px] opacity-40">{opt.category}</span>
            </div>
          </button>
        )) : (
          <div className="p-3 text-[9px] font-black uppercase text-gray-600 italic" role="menuitem" aria-disabled="true">No alternatives</div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 neubrutal-border p-2.5 ${isProcessing ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} group neubrutal-shadow-sm relative transition-all duration-150`}>
      {isProcessing && (
        <div className="absolute top-0 left-0 h-1 bg-black dark:bg-white w-full z-10" />
      )}
      
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`w-10 h-10 flex-shrink-0 bg-brutalYellow neubrutal-border overflow-hidden flex items-center justify-center relative`}>
            {activePreviewUrl ? (
              <>
                <img src={activePreviewUrl} alt={`Preview of ${item.file.name}`} className="w-full h-full object-cover" />
                {isCompleted && (
                  <div className="absolute bottom-0 right-0 bg-black text-brutalYellow text-[6px] font-black px-1 uppercase border-l-2 border-t-2 border-black">
                    {displayExtension}
                  </div>
                )}
              </>
            ) : isAudioFile ? (
               <div className="text-black" aria-label="Audio file"><ICONS.Music /></div>
            ) : isVideoFile ? (
               <div className="text-black" aria-label="Video file"><ICONS.Video /></div>
            ) : is3dFile ? (
               <div className="text-black" aria-label="3D Model"><Icon3D /></div>
            ) : isFontFile ? (
               <div className="text-black" aria-label="Font file"><ICONS.Font /></div>
            ) : isPdfFile ? (
               <div className="text-black" aria-label="PDF Document"><ICONS.Document /></div>
            ) : isPresentationFile ? (
               <div className="text-black" aria-label="Presentation file"><ICONS.Presentation /></div>
            ) : (
              <span className="text-black text-[9px] font-black uppercase leading-none text-center p-1">
                {displayExtension}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-black text-black dark:text-white truncate uppercase tracking-tighter leading-none" title={isCompleted && item.resultName ? item.resultName : item.file.name}>
              {isCompleted ? item.resultName : item.file.name}
            </h3>
            <p className="text-[9px] font-black text-gray-700 dark:text-gray-300 mt-0.5 uppercase">
              {(item.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => onRemove(item.id)} 
          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-red-500 hover:text-white dark:hover:bg-red-600 neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex-shrink-0 outline-none group/remove"
          disabled={isProcessing}
          aria-label={`Remove ${item.file.name}`}
        >
          <div className="animate-snappy group-hover/remove:rotate-90" aria-hidden="true">
            <ICONS.X />
          </div>
        </button>
      </div>

      <div className="mt-2.5 flex flex-col gap-2">
        {(isIdle || isProcessing) && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center mb-0.5">
                <span className="text-[8px] font-black uppercase text-gray-600 dark:text-gray-400" id={`label-${item.id}`}>Target Format</span>
                {isProcessing && (
                     <span className="text-[8px] font-black uppercase text-brutalYellow dark:text-brutalYellow animate-pulse">
                        {Math.round(item.progress)}%
                     </span>
                )}
            </div>
            
            <button
              ref={triggerRef}
              onClick={() => !isProcessing && !isCompleted && setIsDropdownOpen(!isDropdownOpen)}
              onKeyDown={handleKeyDown}
              className={`w-full bg-white dark:bg-zinc-800 neubrutal-border text-[11px] font-black text-black dark:text-white uppercase p-1.5 px-2.5 flex items-center justify-between outline-none ${isProcessing || isCompleted ? 'cursor-not-allowed opacity-50' : 'hover:bg-brutalYellow hover:text-black dark:hover:bg-brutalYellow dark:hover:text-black hover:neubrutal-shadow-sm'}`}
              disabled={isProcessing || isCompleted}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              aria-labelledby={`label-${item.id}`}
            >
              <div className="flex items-center gap-2">
                <span>{selectedOption?.label || 'Select Task'}</span>
              </div>
              <div className={`${isDropdownOpen ? 'rotate-180' : ''} transition-transform duration-100`} aria-hidden="true">
                <ICONS.ChevronDown />
              </div>
            </button>

            {renderDropdown()}
          </div>
        )}

        {isProcessing && (
          <div 
            className="w-full bg-white dark:bg-zinc-900 neubrutal-border h-4 relative overflow-hidden" 
            role="progressbar" 
            aria-valuenow={Math.round(item.progress)} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-label={`Converting ${item.file.name}`}
          >
            <div 
              className="h-full bg-brutalYellow absolute top-0 left-0 transition-all duration-200" 
              style={{ width: `${Math.max(item.progress, 0)}%` }}
            />
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] pointer-events-none" />
          </div>
        )}

        {/* Live region for status updates */}
        <div className="sr-only" aria-live="polite">
            {isProcessing && `Processing ${item.file.name}, ${Math.round(item.progress)}% complete`}
            {isCompleted && `Conversion complete for ${item.file.name}`}
            {isFailed && `Conversion failed for ${item.file.name}: ${item.error}`}
        </div>

        {isCompleted && (
          <div className="flex items-stretch gap-2">
            <button
              onClick={onSuccessClick}
              className="flex-1 bg-green-400 neubrutal-border neubrutal-shadow-sm p-1.5 px-2.5 flex items-center justify-between outline-none neubrutal-button-active hover:brightness-105"
              aria-label="Mark as done"
            >
              <span className="text-[9px] font-black uppercase text-black">SUCCESS</span>
              <div className="scale-75 text-black" aria-hidden="true"><ICONS.Check /></div>
            </button>
            <a
              href={item.resultUrl}
              download={item.resultName}
              className="p-1.5 px-3 text-[9px] font-black text-black bg-brutalYellow hover:bg-yellow-300 neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex items-center gap-1.5 uppercase tracking-tighter outline-none"
              aria-label={`Download converted file: ${item.resultName}`}
            >
              Export <ICONS.Download />
            </a>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2" role="alert">
            <div className="flex-1 bg-red-600 dark:bg-red-800 text-brutalYellow neubrutal-border p-1.5 px-2.5 text-[9px] font-black uppercase leading-tight">
              FAILED
            </div>
            <div className="text-[7px] font-black uppercase text-red-600 dark:text-red-400 max-w-[100px] truncate" title={item.error}>
              {item.error || 'Error'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ConversionCard = React.memo(ConversionCardComponent);
