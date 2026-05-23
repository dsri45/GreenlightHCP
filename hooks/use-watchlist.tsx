import { StockData } from '@/components/portfolio/StockList';
import { STOCK_DEFAULTS } from '@/data/stockLookup';
import { supabase } from '@/lib/supabase';
import { fetchStockQuotes } from '@/services/finnhub-stocks';
import { getCurrentUserId } from '@/services/supabase/auth-user';
import { normalizeAbbreviation } from '@/services/supabase/stock-catalog';
import {
  addUserStockByAbbreviation,
  fetchUserStocks,
  removeUserStockByAbbreviation,
} from '@/services/supabase/user-stocks';
import {
  notifyPortfolioRefresh,
  setWatchlistRefresh,
} from '@/lib/membership-sync';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WatchlistContextValue {
  watchlist: StockData[];
  loading: boolean;
  isWatched: (symbol: string) => boolean;
  addToWatchlist: (stock: WatchlistTrackInput) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  toggleWatchlist: (stock: WatchlistTrackInput) => Promise<void>;
  refreshWatchlist: () => Promise<void>;
}

export interface WatchlistTrackInput {
  symbol: string;
  currentPrice: number;
  yearlyChangePct: number;
  logo?: ImageSourcePropType;
}

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);
const placeholderLogo = require('@/assets/images/icon.png');

function stockDataFromSymbol(
  symbol: string,
  quote?: { currentPrice: number; percentChange: number },
): StockData {
  const normalized = normalizeAbbreviation(symbol);
  const defaults = STOCK_DEFAULTS[normalized];
  const currentPrice = quote?.currentPrice ?? defaults?.currentPrice ?? 0;
  const yearlyChangePct = quote?.percentChange ?? defaults?.yearlyChangePct ?? 0;

  return {
    id: normalized,
    symbol: normalized,
    shares: 0,
    pricePerShare: `$${currentPrice.toFixed(2)}`,
    logo: placeholderLogo,
    isPositive: yearlyChangePct >= 0,
    currentPrice,
    yearlyChangePct,
  };
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 1800);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const refreshWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setWatchlist([]);
        return;
      }

      const rows = await fetchUserStocks(userId, 'watchlist');
      const symbols = rows
        .map((row) => row.stocks?.abbreviation)
        .filter((abbreviation): abbreviation is string => Boolean(abbreviation))
        .map(normalizeAbbreviation);

      if (symbols.length === 0) {
        setWatchlist([]);
        return;
      }

      const quotes = await fetchStockQuotes(symbols);
      setWatchlist(
        symbols.map((symbol) => stockDataFromSymbol(symbol, quotes.get(symbol))),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWatchlist();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      refreshWatchlist();
    });

    return () => subscription.subscription.unsubscribe();
  }, [refreshWatchlist]);

  useEffect(() => {
    setWatchlistRefresh(refreshWatchlist);
    return () => setWatchlistRefresh(null);
  }, [refreshWatchlist]);

  const value = useMemo<WatchlistContextValue>(() => ({
    watchlist,
    loading,
    isWatched: (symbol) =>
      watchlist.some((item) => normalizeAbbreviation(item.symbol) === normalizeAbbreviation(symbol)),
    addToWatchlist: async (stock) => {
      const symbol = normalizeAbbreviation(stock.symbol);
      const userId = await getCurrentUserId();
      if (!userId) return;

      showToast(`Adding ${symbol} to watchlist…`);
      await addUserStockByAbbreviation(userId, symbol, 'watchlist');
      await refreshWatchlist();
      await notifyPortfolioRefresh();
    },
    removeFromWatchlist: async (symbol) => {
      const normalized = normalizeAbbreviation(symbol);
      const userId = await getCurrentUserId();
      if (!userId) return;

      showToast(`Removing ${normalized} from watchlist…`);
      await removeUserStockByAbbreviation(userId, normalized, 'watchlist');
      await refreshWatchlist();
    },
    toggleWatchlist: async (stock) => {
      const symbol = normalizeAbbreviation(stock.symbol);
      const userId = await getCurrentUserId();
      if (!userId) return;

      const watched = watchlist.some((item) => normalizeAbbreviation(item.symbol) === symbol);
      showToast(
        watched ? `Removing ${symbol} from watchlist…` : `Adding ${symbol} to watchlist…`,
      );
      if (watched) {
        await removeUserStockByAbbreviation(userId, symbol, 'watchlist');
      } else {
        await addUserStockByAbbreviation(userId, symbol, 'watchlist');
        await notifyPortfolioRefresh();
      }
      await refreshWatchlist();
    },
    refreshWatchlist,
  }), [watchlist, loading, refreshWatchlist, showToast]);

  return (
    <WatchlistContext.Provider value={value}>
      {children}
      {toastMessage ? (
        <View
          style={[styles.toastHost, { top: insets.top + 8 }]}
          pointerEvents="none"
        >
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    backgroundColor: '#0A2E1A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#166534',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastText: {
    color: '#DCFCE7',
    fontSize: 13,
    fontWeight: '600',
  },
});
