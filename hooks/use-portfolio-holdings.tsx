import { mockPortfolioHoldings, PortfolioHolding } from '@/data/mockPortfolio';
import { fetchStockQuotes } from '@/services/finnhub-stocks';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

interface PortfolioHoldingsContextValue {
  holdings: PortfolioHolding[];
  addShare: (symbol: string) => void;
  removeHolding: (symbol: string) => void;
  buyShares: (symbol: string, count: number, currentPrice: number, yearlyChangePct: number) => void;
  sellShares: (symbol: string, count: number) => void;
}

const PortfolioHoldingsContext = createContext<PortfolioHoldingsContextValue | undefined>(undefined);

export function PortfolioHoldingsProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(mockPortfolioHoldings);

  useEffect(() => {
    let cancelled = false;
    const symbols = mockPortfolioHoldings.map((h) => h.symbol);

    fetchStockQuotes(symbols).then((quoteMap) => {
      if (cancelled) return;

      setHoldings((prev) =>
        prev.map((holding) => {
          const quote = quoteMap.get(holding.symbol);
          if (!quote) return holding; // keep mock price if fetch failed
          return { ...holding, currentPrice: quote.currentPrice };
        })
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<PortfolioHoldingsContextValue>(
    () => ({
      holdings,
      addShare: (symbol: string) => {
        setHoldings((prev) =>
          prev.map((holding) =>
            holding.symbol === symbol ? { ...holding, shares: holding.shares + 1 } : holding
          )
        );
      },
      removeHolding: (symbol: string) => {
        setHoldings((prev) => prev.filter((holding) => holding.symbol !== symbol));
      },
      buyShares: (symbol: string, count: number, currentPrice: number, yearlyChangePct: number) => {
        if (count <= 0) return;
        const normalizedSymbol = symbol.trim().toUpperCase();
        setHoldings((prev) => {
          const existing = prev.find((holding) => holding.symbol === normalizedSymbol);
          if (existing) {
            return prev.map((holding) =>
              holding.symbol === normalizedSymbol
                ? {
                    ...holding,
                    shares: holding.shares + count,
                    currentPrice,
                    yearlyChangePct,
                  }
                : holding
            );
          }
          return [...prev, { symbol: normalizedSymbol, shares: count, currentPrice, yearlyChangePct }];
        });
      },
      sellShares: (symbol: string, count: number) => {
        if (count <= 0) return;
        const normalizedSymbol = symbol.trim().toUpperCase();
        setHoldings((prev) =>
          prev.flatMap((holding) => {
            if (holding.symbol !== normalizedSymbol) {
              return holding;
            }
            const remainingShares = holding.shares - count;
            return remainingShares > 0 ? [{ ...holding, shares: remainingShares }] : [];
          })
        );
      },
    }),
    [holdings]
  );

  return <PortfolioHoldingsContext.Provider value={value}>{children}</PortfolioHoldingsContext.Provider>;
}

export function usePortfolioHoldings() {
  const context = useContext(PortfolioHoldingsContext);
  if (!context) {
    throw new Error('usePortfolioHoldings must be used within a PortfolioHoldingsProvider');
  }
  return context;
}
