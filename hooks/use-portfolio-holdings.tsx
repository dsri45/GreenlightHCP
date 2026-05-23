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
  removeUserStockByAbbreviation,
  sellInvestingShares,
} from '@/services/supabase/user-stocks';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface PortfolioHoldingsContextValue {
  holdings: PortfolioHolding[];
  loading: boolean;
  addShare: (symbol: string) => Promise<void>;
  removeHolding: (symbol: string) => Promise<void>;
  buyShares: (symbol: string, count: number, currentPrice: number, yearlyChangePct: number) => Promise<void>;
  sellShares: (symbol: string, count: number) => Promise<void>;
  refreshHoldings: () => Promise<void>;
}

const PortfolioHoldingsContext = createContext<PortfolioHoldingsContextValue | undefined>(undefined);

export function PortfolioHoldingsProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setHoldings([]);
        return;
      }

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

  const value = useMemo<PortfolioHoldingsContextValue>(
    () => ({
      holdings,
      loading,
      refreshHoldings,
      addShare: async (symbol: string) => {
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return;

        await buyInvestingShares(userId, normalizedSymbol, 1);
        await refreshHoldings();
        await notifyWatchlistRefresh();
      },
      removeHolding: async (symbol: string) => {
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return;

        const holding = holdings.find((item) => item.symbol === normalizedSymbol);
        if (holding) {
          await sellInvestingShares(userId, normalizedSymbol, holding.shares);
        } else {
          await removeUserStockByAbbreviation(userId, normalizedSymbol, 'investing');
        }
        await refreshHoldings();
      },
      buyShares: async (symbol: string, count: number, _currentPrice: number, _yearlyChangePct: number) => {
        if (count <= 0) return;
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return;

        await buyInvestingShares(userId, normalizedSymbol, count);
        await notifyWatchlistRefresh();
        await refreshHoldings();
      },
      sellShares: async (symbol: string, count: number) => {
        if (count <= 0) return;
        const normalizedSymbol = normalizeAbbreviation(symbol);
        const userId = await getCurrentUserId();
        if (!userId) return;

        const holding = holdings.find((item) => item.symbol === normalizedSymbol);
        const owned = holding?.shares ?? 0;
        const toSell = Math.min(count, owned);
        if (toSell <= 0) return;

        await sellInvestingShares(userId, normalizedSymbol, toSell);
        await refreshHoldings();
      },
    }),
    [holdings, loading, refreshHoldings],
  );

  return (
    <PortfolioHoldingsContext.Provider value={value}>{children}</PortfolioHoldingsContext.Provider>
  );
}

export function usePortfolioHoldings() {
  const context = useContext(PortfolioHoldingsContext);
  if (!context) {
    throw new Error('usePortfolioHoldings must be used within a PortfolioHoldingsProvider');
  }
  return context;
}
