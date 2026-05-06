import { PortfolioHolding } from '@/data/mockPortfolio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';
const HOUR_MS = 60 * 60 * 1000;
const POLL_CHECK_MS = 60 * 1000;
const MAX_ARTICLES = 5;

const DEVELOPMENT_KEYWORDS = [
  'earnings',
  'acquisition',
  'merger',
  'guidance',
  'lawsuit',
  'partnership',
  'expansion',
  'bankruptcy',
  'investment',
];

interface NewsApiArticle {
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  source?: {
    name?: string;
  };
}

export interface PortfolioNewsArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  sourceName: string;
}

function getEasternTimeParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  return { weekday, hour, minute };
}

function isUsMarketOpen(date: Date): boolean {
  const { weekday, hour, minute } = getEasternTimeParts(date);
  if (weekday === 'Sat' || weekday === 'Sun') return false;

  const totalMinutes = hour * 60 + minute;
  const openMinutes = 9 * 60 + 30;
  const closeMinutes = 16 * 60;
  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

function sanitizeSymbol(symbol: string): string {
  return symbol.includes(':') ? symbol.split(':').pop()?.trim() ?? symbol : symbol.trim();
}

function buildRelativeAgeLabel(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function usePortfolioNews(holdings: PortfolioHolding[]) {
  const [articles, setArticles] = useState<PortfolioNewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdatedAtRef = useRef<number | null>(null);

  const symbols = useMemo(
    () => holdings.map((holding) => sanitizeSymbol(holding.symbol)).filter(Boolean),
    [holdings]
  );

  const fetchNews = useCallback(
    async (force = false) => {
      if (symbols.length === 0) {
        setArticles([]);
        setError(null);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_NEWS_API_KEY;
      if (!apiKey) {
        setError('Set EXPO_PUBLIC_NEWS_API_KEY to load portfolio news.');
        return;
      }

      const now = Date.now();
      if (!force) {
        const isOpen = isUsMarketOpen(new Date());
        const fetchedRecently = lastUpdatedAtRef.current != null && now - lastUpdatedAtRef.current < HOUR_MS;
        if (!isOpen || fetchedRecently) return;
      }

      setLoading(true);
      setError(null);

      try {
        const focusedSymbols = symbols.slice(0, 8);
        const q = `(${focusedSymbols.join(' OR ')}) AND (${DEVELOPMENT_KEYWORDS.join(' OR ')})`;

        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const params = new URLSearchParams({
          q,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: '25',
          from,
        });

        const response = await fetch(`${NEWS_API_BASE_URL}?${params.toString()}`, {
          headers: { 'X-Api-Key': apiKey },
        });

        if (!response.ok) {
          throw new Error(`News API request failed (${response.status})`);
        }

        const payload = await response.json();
        const rawArticles: NewsApiArticle[] = Array.isArray(payload?.articles) ? payload.articles : [];
        const developmentRegex = new RegExp(DEVELOPMENT_KEYWORDS.join('|'), 'i');

        const normalized = rawArticles
          .filter((article) => article.title && article.url && article.publishedAt)
          .map((article) => ({
            title: article.title as string,
            description: article.description ?? '',
            url: article.url as string,
            publishedAt: article.publishedAt as string,
            sourceName: article.source?.name ?? 'News',
          }))
          .filter((article) => {
            const haystack = `${article.title} ${article.description}`;
            const mentionsHolding = focusedSymbols.some((symbol) =>
              new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(haystack)
            );
            return mentionsHolding && developmentRegex.test(haystack);
          });

        const uniqueByUrl = new Map<string, PortfolioNewsArticle>();
        normalized.forEach((article, index) => {
          if (uniqueByUrl.has(article.url)) return;
          uniqueByUrl.set(article.url, {
            id: `${article.url}-${index}`,
            title: article.title,
            url: article.url,
            publishedAt: article.publishedAt,
            sourceName: article.sourceName,
          });
        });

        setArticles(Array.from(uniqueByUrl.values()).slice(0, MAX_ARTICLES));
        lastUpdatedAtRef.current = Date.now();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio news.');
      } finally {
        setLoading(false);
      }
    },
    [symbols]
  );

  useEffect(() => {
    void fetchNews(true);
  }, [fetchNews]);

  useEffect(() => {
    const timer = setInterval(() => {
      void fetchNews(false);
    }, POLL_CHECK_MS);

    return () => clearInterval(timer);
  }, [fetchNews]);

  return {
    articles,
    loading,
    error,
    refreshNow: () => fetchNews(true),
    getAgeLabel: buildRelativeAgeLabel,
  };
}
