import { StockData } from '@/components/portfolio/StockList';
import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { ImageSourcePropType } from 'react-native';

interface WatchlistContextValue {
  watchlist: StockData[];
  isWatched: (symbol: string) => boolean;
  addToWatchlist: (stock: WatchlistTrackInput) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (stock: WatchlistTrackInput) => void;
}

export interface WatchlistTrackInput {
  symbol: string;
  currentPrice: number;
  yearlyChangePct: number;
  logo?: ImageSourcePropType;
}

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);
const placeholderLogo = require('@/assets/images/icon.png');

const initialWatchlistStocks: StockData[] = [
  { id: '1', symbol: 'AAPL', shares: 0, pricePerShare: '$175.50', logo: placeholderLogo, isPositive: true },
  { id: '2', symbol: 'GOOGL', shares: 0, pricePerShare: '$142.30', logo: placeholderLogo, isPositive: false },
  { id: '3', symbol: 'AMZN', shares: 0, pricePerShare: '$155.75', logo: placeholderLogo, isPositive: true },
  { id: '4', symbol: 'TSLA', shares: 0, pricePerShare: '$248.90', logo: placeholderLogo, isPositive: false },
  { id: '5', symbol: 'META', shares: 0, pricePerShare: '$485.20', logo: placeholderLogo, isPositive: true },
];

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<StockData[]>(initialWatchlistStocks);

  const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

  const value = useMemo<WatchlistContextValue>(() => ({
    watchlist,
    isWatched: (symbol) => watchlist.some((item) => item.symbol.toUpperCase() === normalizeSymbol(symbol)),
    addToWatchlist: (stock) => {
      const symbol = normalizeSymbol(stock.symbol);
      setWatchlist((prev) => {
        if (prev.some((item) => item.symbol.toUpperCase() === symbol)) {
          return prev;
        }

        return [
          ...prev,
          {
            id: `${symbol}-${Date.now()}`,
            symbol,
            shares: 0,
            pricePerShare: `$${stock.currentPrice.toFixed(2)}`,
            logo: stock.logo ?? placeholderLogo,
            isPositive: stock.yearlyChangePct >= 0,
          },
        ];
      });
    },
    removeFromWatchlist: (symbol) => {
      const normalizedSymbol = normalizeSymbol(symbol);
      setWatchlist((prev) => prev.filter((item) => item.symbol.toUpperCase() !== normalizedSymbol));
    },
    toggleWatchlist: (stock) => {
      const symbol = normalizeSymbol(stock.symbol);
      setWatchlist((prev) => {
        if (prev.some((item) => item.symbol.toUpperCase() === symbol)) {
          return prev.filter((item) => item.symbol.toUpperCase() !== symbol);
        }

        return [
          ...prev,
          {
            id: `${symbol}-${Date.now()}`,
            symbol,
            shares: 0,
            pricePerShare: `$${stock.currentPrice.toFixed(2)}`,
            logo: stock.logo ?? placeholderLogo,
            isPositive: stock.yearlyChangePct >= 0,
          },
        ];
      });
    },
  }), [watchlist]);

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
