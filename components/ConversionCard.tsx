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
      
      // 2. Hide redundant same-format conversions
      if (opt.value === 'IMAGE_TO_PNG' && (mime === 'image/png' || name.endsWith('.png'))) return false;
      if (opt.value === 'IMAGE_TO_JPG' && (mime === 'image/jpeg' || mime === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg'))) return false;
      if (opt.value === 'IMAGE_TO_WEBP' && (mime === 'image/webp' || name.endsWith('.webp'))) return false;
      if (opt.value === 'IMAGE_TO_SVG' && (mime === 'image/svg+xml' || name.endsWith('.svg'))) return false;
      if (opt.value === 'IMAGE_TO_ICO' && (mime.includes('icon') || name.endsWith('.ico'))) return false;
      if (opt.value === 'IMAGE_TO_BMP' && (mime === 'image/bmp' || name.endsWith('.bmp'))) return false;

      // Audio Redundancy Checks
      if (opt.value === 'AUDIO_TO_MP3' && (mime === 'audio/mpeg' || mime === 'audio/mp3' || name.endsWith('.mp3'))) return false;
      if (opt.value === 'AUDIO_TO_WAV' && (mime === 'audio/wav' || name.endsWith('.wav'))) return false;
      if (opt.value === 'AUDIO_TO_OGG' && (mime === 'audio/ogg' || name.endsWith('.ogg'))) return false;
      if (opt.value === 'AUDIO_TO_M4A' && (mime === 'audio/mp4' || name.endsWith('.m4a'))) return false;
      if (opt.value === 'AUDIO_TO_WEBM' && (mime === 'audio/webm' || name.endsWith('.webm'))) return false;
      if (opt.value === 'AUDIO_TO_FLAC' && (mime === 'audio/flac' || name.endsWith('.flac'))) return false;
      if (opt.value === 'AUDIO_TO_AAC' && (mime === 'audio/aac' || name.endsWith('.aac'))) return false;
      if (opt.value === 'AUDIO_TO_OPUS' && (mime.includes('opus') || name.endsWith('.opus'))) return false;
      if (opt.value === 'AUDIO_TO_M4R' && (name.endsWith('.m4r'))) return false;
      
      // Video Redundancy Checks
      if (opt.value === 'VIDEO_TO_MP4' && (mime === 'video/mp4' || name.endsWith('.mp4'))) return false;
      if (opt.value === 'VIDEO_TO_WEBM' && (mime === 'video/webm' || name.endsWith('.webm'))) return false;
      if (opt.value === 'VIDEO_TO_MOV' && (mime === 'video/quicktime' || name.endsWith('.mov'))) return false;
      if (opt.value === 'VIDEO_TO_MKV' && (mime === 'video/x-matroska' || name.endsWith('.mkv'))) return false;
      if (opt.value === 'VIDEO_TO_AVI' && (mime === 'video/x-msvideo' || name.endsWith('.avi'))) return false;
      
      // 3D Redundancy
      if (opt.value === 'OBJ_TO_STL' && name.endsWith('.stl')) return false;
      if (opt.value === 'STL_TO_OBJ' && name.endsWith('.obj')) return false;
      if (opt.value === 'GLB_TO_OBJ' && name.endsWith('.obj')) return false;
      if (opt.value === 'GLB_TO_STL' && name.endsWith('.stl')) return false;

      // Font Redundancy
      if (opt.value === 'FONT_TO_TTF' && name.endsWith('.ttf')) return false;
      if (opt.value === 'FONT_TO_OTF' && name.endsWith('.otf')) return false;
      if (opt.value === 'FONT_TO_WOFF' && name.endsWith('.woff')) return false;

      if (opt.value === 'PDF_TO_PNG' && isPdfFile && isCompleted && item.resultName?.endsWith('.png')) return false;

      // 3. Category logic - ensure data tools don't show for images, etc.
      const isDataFile = name.endsWith('.json') || name.endsWith('.csv') || name.endsWith('.yaml') || name.endsWith('.xml') || name.endsWith('.tsv');
      if (opt.category === 'Data' && !isDataFile) return false;

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
          <div className="p-3 text-[9px] font-black uppercase text-gray-400 italic" role="menuitem" aria-disabled="true">No alternatives</div>
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
               <div className="text-black"><ICONS.Music /></div>
            ) : isVideoFile ? (
               <div className="text-black"><ICONS.Video /></div>
            ) : is3dFile ? (
               <div className="text-black"><Icon3D /></div>
            ) : isFontFile ? (
               <div className="text-black"><ICONS.Font /></div>
            ) : isPdfFile ? (
               <div className="text-black"><ICONS.Document /></div>
            ) : (
              <span className="text-black text-[9px] font-black uppercase leading-none text-center p-1">
                {displayExtension}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-black text-black dark:text-white truncate uppercase tracking-tighter leading-none">
              {isCompleted ? item.resultName : item.file.name}
            </h3>
            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 mt-0.5 uppercase">
              {(item.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => onRemove(item.id)} 
          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-red-500 hover:text-white dark:hover:bg-red-600 neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex-shrink-0 outline-none group/remove"
          disabled={isProcessing}
          aria-label="Remove file"
        >
          <div className="animate-snappy group-hover/remove:rotate-90">
            <ICONS.X />
          </div>
        </button>
      </div>

      <div className="mt-2.5 flex flex-col gap-2">
        {(isIdle || isProcessing) && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500 mb-0.5">Target Format</span>
            
            <button
              ref={triggerRef}
              onClick={() => !isProcessing && !isCompleted && setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full bg-white dark:bg-zinc-800 neubrutal-border text-[11px] font-black text-black dark:text-white uppercase p-1.5 px-2.5 flex items-center justify-between outline-none ${isProcessing || isCompleted ? 'cursor-not-allowed opacity-50' : 'hover:bg-brutalYellow hover:text-black dark:hover:bg-brutalYellow dark:hover:text-black hover:neubrutal-shadow-sm'}`}
              disabled={isProcessing || isCompleted}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              aria-label="Select target format"
            >
              <div className="flex items-center gap-2">
                <span>{selectedOption?.label || 'Select Task'}</span>
              </div>
              <div className={`${isDropdownOpen ? 'rotate-180' : ''} transition-transform duration-100`}>
                <ICONS.ChevronDown />
              </div>
            </button>

            {renderDropdown()}
          </div>
        )}

        {isProcessing && (
          <div 
            className="w-full bg-white dark:bg-zinc-800 neubrutal-border h-3 overflow-hidden relative" 
            role="progressbar" 
            aria-valuenow={Math.max(item.progress, 5)} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-label="Conversion progress"
          >
            <div 
              className={`h-full bg-black dark:bg-white transition-all duration-300`} 
              style={{ width: `${Math.max(item.progress, 5)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-brutalYellow uppercase mix-blend-difference tracking-widest">
              WORKING...
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-stretch gap-2">
            <button
              onClick={onSuccessClick}
              className="flex-1 bg-green-400 neubrutal-border neubrutal-shadow-sm p-1.5 px-2.5 flex items-center justify-between outline-none neubrutal-button-active hover:brightness-105"
            >
              <span className="text-[9px] font-black uppercase text-black">SUCCESS</span>
              <div className="scale-75 text-black"><ICONS.Check /></div>
            </button>
            <a
              href={item.resultUrl}
              download={item.resultName}
              className="p-1.5 px-3 text-[9px] font-black text-black bg-brutalYellow hover:bg-yellow-300 neubrutal-border neubrutal-shadow-sm neubrutal-button-active flex items-center gap-1.5 uppercase tracking-tighter outline-none"
            >
              Export <ICONS.Download />
            </a>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2">
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