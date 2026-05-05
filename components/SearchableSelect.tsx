import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';

// Remove acentos para busca insensível a acentuação
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  heightClass?: string;
}

export default function SearchableSelect({ 
  options,
  value, 
  onChange, 
  placeholder = "Selecione...",
  className = "",
  heightClass = "py-2.5"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  const handleOpen = () => {
    setSearch('');
    setIsOpen(true);
  };

  const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : '');

  const filteredOptions = options.filter(opt => 
    normalizeText(opt.label).includes(normalizeText(search))
  );

  return (
    <div className={'relative w-full ' + className} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className={'glass-input w-full pl-4 pr-10 text-slate-800 dark:text-slate-200 text-base sm:text-sm ' + heightClass}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleOpen}
        />
        <button 
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg active:bg-slate-100 dark:active:bg-slate-700 transition-colors" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Fechar lista' : 'Abrir lista'}
        >
          <ChevronDown className={'w-4 h-4 transition-transform ' + (isOpen ? 'rotate-180' : '')} />
        </button>
      </div>

      {mounted && dropdownPos && ReactDOM.createPortal(
        isOpen ? (
          <div
            ref={dropdownRef}
            className="glass-dropdown fixed max-h-60 sm:max-h-60 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 99999 }}
          >
            <ul className="overflow-y-auto p-1 overscroll-contain">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 sm:py-2 text-sm text-slate-500 dark:text-slate-400 text-center">Nenhum resultado</li>
              ) : (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    className={'px-3 py-3 sm:py-2.5 text-base sm:text-sm rounded-xl sm:rounded-lg cursor-pointer transition-colors active:scale-[0.98] ' + (value === opt.value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700/50')}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
}
