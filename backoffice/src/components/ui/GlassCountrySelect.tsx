import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CountryOption {
  code: string;
  name: string;
  flagUrl: string;
}

// Common aliases for mapping legacy DB values (English / shortcuts) to French country options
const COUNTRY_ALIASES: Record<string, string> = {
  italy: 'it',
  germany: 'de',
  france: 'fr',
  'united kingdom': 'gb',
  uk: 'gb',
  'great britain': 'gb',
  usa: 'us',
  'united states': 'us',
  japan: 'jp',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  austria: 'at',
  netherlands: 'nl',
  belgium: 'be',
  canada: 'ca',
  australia: 'au',
  monaco: 'mc',
};

// Global cache for fetched countries
let countriesPromise: Promise<CountryOption[]> | null = null;
let cachedCountriesList: CountryOption[] | null = null;

export const fetchCountriesFromApi = async (): Promise<CountryOption[]> => {
  if (cachedCountriesList) return cachedCountriesList;
  if (!countriesPromise) {
    countriesPromise = fetch('https://flagcdn.com/fr/codes.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch country codes');
        return res.json();
      })
      .then((data: Record<string, string>) => {
        const list: CountryOption[] = Object.entries(data)
          .filter(([code]) => code.length === 2)
          .map(([code, name]) => ({
            code: code.toLowerCase(),
            name,
            flagUrl: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

        cachedCountriesList = list;
        return list;
      })
      .catch((err) => {
        console.error('Country fetch error:', err);
        return [];
      });
  }
  return countriesPromise;
};

interface GlassCountrySelectProps {
  label?: string;
  value: string;
  onChange: (countryName: string) => void;
  required?: boolean;
  className?: string;
  error?: string;
}

export const GlassCountrySelect: React.FC<GlassCountrySelectProps> = ({
  label = 'Pays d\'origine',
  value,
  onChange,
  required = false,
  className,
  error,
}) => {
  const [countries, setCountries] = useState<CountryOption[]>(cachedCountriesList || []);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load countries via API on mount
  useEffect(() => {
    let isCancelled = false;
    fetchCountriesFromApi().then((list) => {
      if (!isCancelled && list.length > 0) {
        setCountries(list);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Resolve matching country for current value
  const matchedCountry = useMemo(() => {
    if (!value) return null;
    const clean = value.trim().toLowerCase();

    // 1. Direct match with French name
    const byName = countries.find((c) => c.name.toLowerCase() === clean);
    if (byName) return byName;

    // 2. Direct match with code
    const byCode = countries.find((c) => c.code === clean);
    if (byCode) return byCode;

    // 3. Match via common aliases
    const aliasCode = COUNTRY_ALIASES[clean];
    if (aliasCode) {
      const byAlias = countries.find((c) => c.code === aliasCode);
      if (byAlias) return byAlias;
    }

    // 4. Substring / partial match
    return countries.find((c) => c.name.toLowerCase().startsWith(clean)) || null;
  }, [value, countries]);

  // Filtered countries for the dropdown list
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q
    );
  }, [countries, searchQuery]);

  const hasValue = Boolean(value.trim());
  const isFloating = isOpen || hasValue;

  const handleSelect = (country: CountryOption) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full select-none', className)}>
      {/* Animated Floating Label */}
      {label && (
        <motion.label
          initial={false}
          animate={
            isFloating
              ? {
                  y: 6,
                  scale: 0.72,
                  color: error ? '#ff2433' : isOpen ? '#18181b' : '#71717a',
                }
              : {
                  y: 18,
                  scale: 1,
                  color: '#a1a1aa',
                }
          }
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn(
            'absolute left-4 top-0 origin-left font-sans font-medium pointer-events-none select-none text-sm z-10',
            isFloating && 'font-semibold'
          )}
        >
          {label}
        </motion.label>
      )}

      {/* Main Select Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full h-[58px] rounded-2xl bg-zinc-50 border border-zinc-200/90 text-sm text-zinc-900 font-medium',
          'flex items-center justify-between text-left transition-all duration-200 cursor-pointer pt-6 pb-2 px-4',
          'hover:border-zinc-300 focus:outline-none focus:border-zinc-900 focus:bg-white',
          isOpen && 'border-zinc-900 bg-white ring-2 ring-zinc-950/10 shadow-xs',
          error && 'border-red-500 focus:border-red-500 ring-red-500/20'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {matchedCountry ? (
            <>
              <img
                src={matchedCountry.flagUrl}
                alt={matchedCountry.name}
                className="w-5 h-3.5 object-cover rounded-xs border border-zinc-200/80 shadow-xs shrink-0"
              />
              <span className="font-sans text-sm font-medium text-zinc-900 truncate">
                {matchedCountry.name}
              </span>
            </>
          ) : hasValue ? (
            <span className="font-sans text-sm font-medium text-zinc-900 truncate">
              {value}
            </span>
          ) : isFloating ? (
            <span className="text-zinc-400 text-sm font-normal">
              Sélectionner un pays...
            </span>
          ) : null}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-2',
            isOpen && 'transform rotate-180 text-zinc-900'
          )}
        />
      </button>

      {/* Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-zinc-200/90 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs font-sans font-medium text-zinc-900 bg-white border border-zinc-200/90 rounded-xl placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* Scrollable Country List */}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain">
              {filteredCountries.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-400 font-sans font-medium">
                  Aucun pays trouvé
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = matchedCountry?.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-sans transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-zinc-100 font-semibold text-zinc-950'
                          : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={c.flagUrl}
                          alt={c.name}
                          className="w-5 h-3.5 object-cover rounded-xs border border-zinc-200/80 shadow-xs shrink-0"
                          loading="lazy"
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden input for form constraint / validation if required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          value={value}
          onChange={() => {}}
          required
        />
      )}
    </div>
  );
};
