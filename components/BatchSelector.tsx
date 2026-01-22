
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CONVERSION_OPTIONS, ICONS } from '../constants';
import { ConversionType, FileItem } from '../types';

interface BatchSelectorProps {
  onSelect: (type: ConversionType) => void;
  files: FileItem[];
}

export const BatchSelector: React.FC<BatchSelectorProps> = ({ onSelect, files }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Filter options to show only those relevant to the current batch of files.
  // We show an option if it is supported by at least one file in the list.
  const relevantOptions = useMemo(() => {
    if (files.length === 0) return CONVERSION_OPTIONS;

    const supportedValues = new Set<ConversionType>();
    
    files.forEach(fileItem => {
      CONVERSION_OPTIONS.forEach(opt => {
        if (opt.isSupported(fileItem.file)) {
          supportedValues.add(opt.value);
        }
      });
    });

    return CONVERSION_OPTIONS.filter(opt => supportedValues.has(opt.value));
  }, [files]);

  // Check if all files share the same conversion type
  const commonType = useMemo(() => {
    if (files.length === 0) return null;
    const firstType = files[0].type;
    return files.every(f => f.type === firstType) ? firstType : null;
  }, [files]);

  const triggerLabel = useMemo(() => {
      if (commonType) {
          const opt = CONVERSION_OPTIONS.find(o => o.value === commonType);
          return opt ? opt.label : 'Select Output Format...';
      }
      return 'Select Output Format...';
  }, [commonType]);

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
    if (isOpen) {
      updateDropdownCoords();
      window.addEventListener('scroll', updateDropdownCoords, true);
      window.addEventListener('resize', updateDropdownCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownCoords, true);
      window.removeEventListener('resize', updateDropdownCoords);
    };
  }, [isOpen, updateDropdownCoords]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
    }
  };

  const renderDropdown = () => {
    if (!isOpen || !dropdownCoords) return null;

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
        className="bg-white dark:bg-zinc-900 neubrutal-border max-h-[300px] overflow-y-auto custom-scrollbar shadow-2xl"
      >
        {relevantOptions.length > 0 ? (
            relevantOptions.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => {
                        onSelect(opt.value);
                        setIsOpen(false);
                        triggerRef.current?.focus();
                    }}
                    className={`w-full text-left p-2 px-3 text-[11px] font-black uppercase border-b last:border-b-0 border-black dark:border-white/20 transition-colors
                        ${commonType === opt.value 
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
            ))
        ) : (
            <div className="p-3 text-[9px] font-black uppercase text-gray-500 text-center">No options available</div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
        <button
            ref={triggerRef}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white dark:bg-zinc-800 neubrutal-border text-[11px] font-black text-black dark:text-white uppercase p-1.5 px-2.5 flex items-center justify-between outline-none hover:bg-brutalYellow hover:text-black dark:hover:bg-brutalYellow dark:hover:text-black hover:neubrutal-shadow-sm transition-all"
            aria-label="Open batch format selector"
            aria-expanded={isOpen}
            aria-haspopup="true"
        >
            <div className="flex items-center gap-2">
                <span className="bg-black dark:bg-white text-white dark:text-black text-[9px] px-1.5 py-0.5">ALL</span>
                <span>{triggerLabel}</span>
            </div>
            <div className={`transform transition-transform duration-100 ${isOpen ? 'rotate-180' : ''}`}>
                <ICONS.ChevronDown />
            </div>
        </button>
        {renderDropdown()}
    </>
  );
}
