import { PortfolioHolding } from '@/data/mockPortfolio';
import { ResolvedStock, resolveStockSearch } from '@/data/stockLookup';
import { fetchStockQuote } from '@/services/finnhub-stocks';
import { useEffect, useMemo, useState } from 'react';

const DEBOUNCE_MS = 500;
const TICKER_PATTERN = /^[A-Z]{1,5}$/;

export type ResolvedStockSource = 'lookup' | 'finnhub';

export interface ResolvedStockResult {
  stock: ResolvedStock | null;
  loading: boolean;
  source: ResolvedStockSource | null;
}

export function useResolvedStock(query: string, holdings: PortfolioHolding[]): ResolvedStockResult {
  const trimmed = query.trim();

  // Step 1: Try the local lookup first (synchronous)
  const lookupResult = useMemo(
    () => (trimmed ? resolveStockSearch(trimmed, holdings) : null),
    [trimmed, holdings]
  );

  // Step 2: If lookup misses AND the query looks like a ticker, try Finnhub
  const [finnhubResult, setFinnhubResult] = useState<ResolvedStock | null>(null);
  const [finnhubLoading, setFinnhubLoading] = useState(false);

  useEffect(() => {
    // No query, or lookup already found it -> no Finnhub needed
    if (!trimmed || lookupResult) {
      setFinnhubResult(null);
      setFinnhubLoading(false);
      return;
    }

    // Only fire Finnhub for queries that look like a ticker (1-5 uppercase letters)
    const tickerCandidate = trimmed.toUpperCase();
    if (!TICKER_PATTERN.test(tickerCandidate)) {
      setFinnhubResult(null);
      setFinnhubLoading(false);
      return;
    }

    let cancelled = false;
    setFinnhubLoading(true);

    // Debounce: wait for typing to stop before firing
    const timer = setTimeout(() => {
      fetchStockQuote(tickerCandidate)
        .then((quote) => {
          if (cancelled) return;
          if (!quote) {
            setFinnhubResult(null);
          } else {
            setFinnhubResult({
              symbol: tickerCandidate,
              displayName: tickerCandidate, // Free tier doesn't include company name
              currentPrice: quote.currentPrice,
              yearlyChangePct: quote.percentChange, // Actually today's change; bento label adjusts
            });
          }
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
  }, [trimmed, lookupResult]);

  // Return the right result based on which source resolved
  if (lookupResult) {
    return { stock: lookupResult, loading: false, source: 'lookup' };
  }
  if (finnhubLoading) {
    return { stock: null, loading: true, source: null };
  }
  if (finnhubResult) {
    return { stock: finnhubResult, loading: false, source: 'finnhub' };
  }
  return { stock: null, loading: false, source: null };
}