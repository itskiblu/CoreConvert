
import React, { useState } from 'react';
import { FileItem, ConversionStatus, ConversionType } from '../types';
import { ICONS, CONVERSION_OPTIONS } from '../constants';

interface Props {
  item: FileItem;
  onRemove: (id: string) => void;
  onConvert: (id: string) => void;
  onChangeType: (id: string, type: ConversionType) => void;
}

export const ConversionCard: React.FC<Props> = ({ item, onRemove, onConvert, onChangeType }) => {
  const isAI = item.type.startsWith('AI_');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={`neubrutal-border p-3 flex flex-col gap-3 transition-all ${isAI ? 'border-indigo-500 shadow-[4px_4px_0px_0px_rgba(99,102,241,1)]' : 'neubrutal-shadow-sm'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${isAI ? 'bg-indigo-500 text-white' : 'bg-brutalYellow text-black'}`}>
            {isAI ? <ICONS.SmartAI /> : <ICONS.Document />}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-[11px] font-black truncate uppercase">{item.file.name}</h4>
            <p className="text-[9px] font-bold opacity-50 uppercase">{item.type}</p>
          </div>
        </div>
        <button onClick={() => onRemove(item.id)} className="text-red-500"><ICONS.X /></button>
      </div>

      {item.status === ConversionStatus.IDLE && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full text-left p-2 bg-gray-50 dark:bg-zinc-800 text-[10px] font-black uppercase flex justify-between items-center neubrutal-border"
            >
              {CONVERSION_OPTIONS.find(o => o.value === item.type)?.label || 'Select Task'}
              <ICONS.ChevronDown />
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-900 z-50 neubrutal-border max-h-40 overflow-y-auto">
                {CONVERSION_OPTIONS.filter(o => o.isSupported(item.file)).map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => { onChangeType(item.id, opt.value); setIsMenuOpen(false); }}
                    className="w-full text-left p-2 text-[9px] font-black uppercase hover:bg-brutalYellow hover:text-black border-b border-black/10 last:border-none"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onConvert(item.id)} className={`p-2 text-[10px] font-black uppercase ${isAI ? 'bg-indigo-600 text-white' : 'bg-black text-white dark:bg-white dark:text-black'}`}>
            Start {isAI ? 'Analysis' : 'Conversion'}
          </button>
        </div>
      )}

      {item.status === ConversionStatus.PROCESSING && (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-black uppercase">
            <span>{isAI ? 'Thinking...' : 'Processing...'}</span>
            <span>{Math.round(item.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 h-2 neubrutal-border overflow-hidden">
            <div className={`h-full transition-all ${isAI ? 'bg-indigo-500' : 'bg-brutalYellow'}`} style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      )}

      {item.status === ConversionStatus.COMPLETED && (
        <a href={item.resultUrl} download={item.resultName} className="p-2 bg-green-400 text-black text-[10px] font-black uppercase flex justify-center items-center gap-2 neubrutal-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          Download Result <ICONS.Download />
        </a>
      )}

      {item.status === ConversionStatus.FAILED && (
        <div className="p-2 bg-red-100 text-red-600 text-[9px] font-black uppercase neubrutal-border">
          Error: {item.error}
        </div>
      )}
    </div>
  );
};
