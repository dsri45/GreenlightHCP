import { PortfolioHolding, mockPortfolioHoldings } from '@/data/mockPortfolio';
import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface PortfolioHoldingsContextValue {
  holdings: PortfolioHolding[];
  addShare: (symbol: string) => void;
  removeHolding: (symbol: string) => void;
}

const PortfolioHoldingsContext = createContext<PortfolioHoldingsContextValue | undefined>(undefined);

export function PortfolioHoldingsProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(mockPortfolioHoldings);

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
