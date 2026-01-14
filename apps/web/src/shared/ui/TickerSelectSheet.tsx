import { useState, useCallback } from 'react';
import type { Market } from '@invest-assist/core';
import { BottomSheet } from './BottomSheet';
import { useTickerSearch, type TickerInfo } from '@/entities/ticker';

interface TickerSelectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ticker: TickerInfo) => void;
  initialMarket?: Market;
}

const MARKET_TABS: { value: Market | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'KRX', label: 'KRX' },
  { value: 'KOSDAQ', label: 'KOSDAQ' },
  { value: 'NYSE', label: 'NYSE' },
  { value: 'NASDAQ', label: 'NASDAQ' },
];

export function TickerSelectSheet({
  isOpen,
  onClose,
  onSelect,
  initialMarket,
}: TickerSelectSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<Market | 'ALL'>(initialMarket || 'ALL');

  const marketFilter = selectedMarket === 'ALL' ? undefined : selectedMarket;
  const { data, isLoading } = useTickerSearch(searchQuery, marketFilter);
  const results = data?.results || [];

  const handleSelect = useCallback(
    (ticker: TickerInfo) => {
      onSelect(ticker);
      onClose();
      setSearchQuery('');
    },
    [onSelect, onClose]
  );

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
  }, [onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="종목 선택">
      <div className="flex flex-col h-full">
        {/* Search Input */}
        <div className="px-5 py-3">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="종목명 또는 코드 검색"
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-100 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>

        {/* Market Tabs */}
        <div className="px-5 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {MARKET_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedMarket(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedMarket === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-safe">
          {searchQuery.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p>검색어를 입력하세요</p>
            </div>
          ) : isLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((ticker) => (
                <li key={`${ticker.ticker}-${ticker.market}`}>
                  <button
                    onClick={() => handleSelect(ticker)}
                    className="w-full p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">
                            {ticker.ticker}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {ticker.market}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {ticker.name}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 ml-3">
                        {ticker.type === 'ETF' && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            ETF
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p>검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
