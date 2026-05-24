import { PortfolioHolding } from '@/data/mockPortfolio';
import { STOCK_DEFAULTS } from '@/data/stockLookup';
import { notifyWatchlistRefresh, setPortfolioRefresh } from '@/lib/membership-sync';
import { supabase } from '@/lib/supabase';
import { fetchStockQuotes } from '@/services/finnhub-stocks';
import { getCurrentUserId } from '@/services/supabase/auth-user';
import { normalizeAbbreviation } from '@/services/supabase/stock-catalog';
import {
  buyInvestingShares,
  fetchUserStocks,
  InsufficientFundsError,
  removeUserStockByAbbreviation,
  sellInvestingShares,
} from '@/services/supabase/user-stocks';
import {
  DEFAULT_STARTING_CASH,
  ensureUserPortfolio,
} from '@/services/supabase/user-portfolio';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TradeResult = { ok: true } | { ok: false; error: string };

function tradeErrorMessage(error: unknown): string {
  if (error instanceof InsufficientFundsError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

interface PortfolioHoldingsContextValue {
  holdings: PortfolioHolding[];
  cash: number;
  investedValue: number;
  totalValue: number;
  loading: boolean;
  addShare: (symbol: string, pricePerShare: number) => Promise<TradeResult>;
  removeHolding: (symbol: string, pricePerShare: number) => Promise<TradeResult>;
  buyShares: (
    symbol: string,
    count: number,
    currentPrice: number,
    yearlyChangePct: number,
  ) => Promise<TradeResult>;
  sellShares: (symbol: string, count: number, pricePerShare: number) => Promise<TradeResult>;
  refreshHoldings: () => Promise<void>;
}

const PortfolioHoldingsContext = createContext<PortfolioHoldingsContextValue | undefined>(undefined);

export function PortfolioHoldingsProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [cash, setCash] = useState(DEFAULT_STARTING_CASH);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 1800);
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(null);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const refreshHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setHoldings([]);
        setCash(DEFAULT_STARTING_CASH);
        return;
      }

      const portfolio = await ensureUserPortfolio(userId);
      setCash(portfolio.money);

      const rows = await fetchUserStocks(userId, 'investing');
      const investingRows = rows.filter((row) => (row.shares ?? 0) > 0 && row.stocks?.abbreviation);

      if (investingRows.length === 0) {
        setHoldings([]);
        return;
      }

      const symbols = investingRows.map((row) =>
        normalizeAbbreviation(row.stocks!.abbreviation),
      );

      const quotes = await fetchStockQuotes(symbols);
      setHoldings(
        investingRows.map((row) => {
          const symbol = normalizeAbbreviation(row.stocks!.abbreviation);
          const quote = quotes.get(symbol);
          const defaults = STOCK_DEFAULTS[symbol];
          const currentPrice = quote?.currentPrice ?? defaults?.currentPrice ?? 0;
          const yearlyChangePct = quote?.percentChange ?? defaults?.yearlyChangePct ?? 0;
          return {
            symbol,
            shares: row.shares ?? 0,
            currentPrice,
            yearlyChangePct,
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHoldings();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      refreshHoldings();
    });

    return () => subscription.subscription.unsubscribe();
  }, [refreshHoldings]);

  useEffect(() => {
    setPortfolioRefresh(refreshHoldings);
    return () => setPortfolioRefresh(null);
  }, [refreshHoldings]);

  const investedValue = useMemo(
    () => holdings.reduce((sum, holding) => sum + holding.currentPrice * holding.shares, 0),
    [holdings],
  );

  const totalValue = cash + investedValue;

  const value = useMemo<PortfolioHoldingsContextValue>(
    () => ({
      holdings,
      cash,
      investedValue,
      totalValue,
      loading,
      refreshHoldings,
      addShare: async (symbol: string, pricePerShare: number) => {
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return { ok: false, error: 'You must be signed in to buy shares.' };

        showToast(`Buying 1 ${normalizedSymbol} share…`);
        try {
          await buyInvestingShares(userId, normalizedSymbol, 1, pricePerShare);
          await refreshHoldings();
          await notifyWatchlistRefresh();
          clearToast();
          return { ok: true };
        } catch (error) {
          clearToast();
          return { ok: false, error: tradeErrorMessage(error) };
        }
      },
      removeHolding: async (symbol: string, pricePerShare: number) => {
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return { ok: false, error: 'You must be signed in to sell shares.' };

        try {
          const holding = holdings.find((item) => item.symbol === normalizedSymbol);
          if (holding) {
            await sellInvestingShares(userId, normalizedSymbol, holding.shares, pricePerShare);
          } else {
            await removeUserStockByAbbreviation(userId, normalizedSymbol, 'investing');
          }
          await refreshHoldings();
          return { ok: true };
        } catch (error) {
          return { ok: false, error: tradeErrorMessage(error) };
        }
      },
      buyShares: async (symbol: string, count: number, currentPrice: number, _yearlyChangePct: number) => {
        if (count <= 0) return { ok: false, error: 'Enter a valid share quantity.' };
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return { ok: false, error: 'You must be signed in to buy shares.' };

        const shareLabel = count === 1 ? 'share' : 'shares';
        showToast(`Buying ${count} ${normalizedSymbol} ${shareLabel}…`);
        try {
          await buyInvestingShares(userId, normalizedSymbol, count, currentPrice);
          await notifyWatchlistRefresh();
          await refreshHoldings();
          clearToast();
          return { ok: true };
        } catch (error) {
          clearToast();
          return { ok: false, error: tradeErrorMessage(error) };
        }
      },
      sellShares: async (symbol: string, count: number, pricePerShare: number) => {
        if (count <= 0) return { ok: false, error: 'Enter a valid share quantity.' };
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return { ok: false, error: 'You must be signed in to sell shares.' };

        const holding = holdings.find((item) => item.symbol === normalizedSymbol);
        const owned = holding?.shares ?? 0;
        const toSell = Math.min(count, owned);
        if (toSell <= 0) return { ok: false, error: 'You do not own any shares to sell.' };

        try {
          await sellInvestingShares(userId, normalizedSymbol, toSell, pricePerShare);
          await refreshHoldings();
          return { ok: true };
        } catch (error) {
          return { ok: false, error: tradeErrorMessage(error) };
        }
      },
    }),
    [holdings, cash, investedValue, totalValue, loading, refreshHoldings, showToast, clearToast],
  );

  return (
    <PortfolioHoldingsContext.Provider value={value}>
      {children}
      {toastMessage ? (
        <View
          style={[portfolioToastStyles.toastHost, { top: insets.top + 8 }]}
          pointerEvents="none"
        >
          <View style={portfolioToastStyles.toast}>
            <Text style={portfolioToastStyles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}
    </PortfolioHoldingsContext.Provider>
  );
}

export function usePortfolioHoldings() {
  const context = useContext(PortfolioHoldingsContext);
  if (!context) {
    throw new Error('usePortfolioHoldings must be used within a PortfolioHoldingsProvider');
  }
  return context;
}

const portfolioToastStyles = StyleSheet.create({
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
