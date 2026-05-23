import { PortfolioHolding } from '@/data/mockPortfolio';
import { ResolvedStock } from '@/data/stockLookup';
import { resolveStockFromDatabase } from '@/services/supabase/stock-search';
import { ensureStockByAbbreviation } from '@/services/supabase/stocks';
import { fetchStockQuote } from '@/services/finnhub-stocks';
import { useEffect, useState } from 'react';

const DEBOUNCE_MS = 500;
const TICKER_PATTERN = /^[A-Z]{1,5}$/;

export type ResolvedStockSource = 'database' | 'finnhub';

export interface ResolvedStockResult {
  stock: ResolvedStock | null;
  loading: boolean;
  source: ResolvedStockSource | null;
}

export function useResolvedStock(query: string, holdings: PortfolioHolding[]): ResolvedStockResult {
  const trimmed = query.trim();
  const [databaseResult, setDatabaseResult] = useState<ResolvedStock | null>(null);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [finnhubResult, setFinnhubResult] = useState<ResolvedStock | null>(null);
  const [finnhubLoading, setFinnhubLoading] = useState(false);

  useEffect(() => {
    if (!trimmed) {
      setDatabaseResult(null);
      setDatabaseLoading(false);
      return;
    }

    let cancelled = false;
    setDatabaseLoading(true);

    const timer = setTimeout(() => {
      resolveStockFromDatabase(trimmed, holdings)
        .then((result) => {
          if (cancelled) return;
          setDatabaseResult(
            result
              ? {
                  symbol: result.symbol,
                  displayName: result.displayName,
                  currentPrice: result.currentPrice,
                  yearlyChangePct: result.yearlyChangePct,
                }
              : null,
          );
        })
        .catch(() => {
          if (cancelled) return;
          setDatabaseResult(null);
        })
        .finally(() => {
          if (cancelled) return;
          setDatabaseLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, holdings]);

  useEffect(() => {
    if (!trimmed || databaseResult || databaseLoading) {
      setFinnhubResult(null);
      setFinnhubLoading(false);
      return;
    }

    const tickerCandidate = trimmed.toUpperCase();
    if (!TICKER_PATTERN.test(tickerCandidate)) {
      setFinnhubResult(null);
      setFinnhubLoading(false);
      return;
    }

    let cancelled = false;
    setFinnhubLoading(true);

    const timer = setTimeout(() => {
      fetchStockQuote(tickerCandidate)
        .then(async (quote) => {
          if (cancelled) return;
          if (!quote) {
            setFinnhubResult(null);
            return;
          }

          try {
            await ensureStockByAbbreviation(tickerCandidate);
          } catch {
            // Stock exists via Finnhub; keep showing results even if the DB write fails.
          }
          if (cancelled) return;

          setFinnhubResult({
            symbol: tickerCandidate,
            displayName: tickerCandidate,
            currentPrice: quote.currentPrice,
            yearlyChangePct: quote.percentChange,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setFinnhubResult(null);
        })
        .finally(() => {
          if (cancelled) return;
          setFinnhubLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, databaseResult, databaseLoading]);

  if (databaseLoading) {
    return { stock: null, loading: true, source: null };
  }
  if (databaseResult) {
    return { stock: databaseResult, loading: false, source: 'database' };
  }
  if (finnhubLoading) {
    return { stock: null, loading: true, source: null };
  }
  if (finnhubResult) {
    return { stock: finnhubResult, loading: false, source: 'finnhub' };
  }
  return { stock: null, loading: false, source: null };
}
