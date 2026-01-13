import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Market } from '@invest-assist/core';
import { useTickerSearch, type TickerInfo } from '@/entities/ticker';

interface TickerAutocompleteProps {
  value: string;
  onChange: (ticker: string) => void;
  onSelect: (ticker: TickerInfo) => void;
  market?: Market;
  placeholder?: string;
  className?: string;
}

export function TickerAutocomplete({
  value,
  onChange,
  onSelect,
  market,
  placeholder,
  className = '',
}: TickerAutocompleteProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const { data, isLoading } = useTickerSearch(searchQuery, market);
  const results = data?.results || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setIsOpen(true);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (ticker: TickerInfo) => {
      onSelect(ticker);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleFocus = useCallback(() => {
    if (value.length >= 1) {
      setIsOpen(true);
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    []
  );

  const showDropdown = isOpen && value.length >= 1;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input text-sm w-full"
        autoComplete="off"
      />

      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-elevated max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-center text-text-secondary text-sm">
              {t('common.loading')}
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((ticker) => (
                <li key={`${ticker.ticker}-${ticker.market}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(ticker)}
                    className="w-full px-3 py-2 text-left hover:bg-background transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {ticker.ticker}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-background text-text-secondary">
                          {ticker.market}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary truncate">
                        {ticker.name}
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary shrink-0">
                      {ticker.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-center text-text-secondary text-sm">
              {t('ticker.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
