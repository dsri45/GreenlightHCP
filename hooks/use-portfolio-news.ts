import { PortfolioHolding } from '@/data/mockPortfolio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const NEWS_API_BASE_URL = 'https://eventregistry.org/api/v1/article/getArticles';
const HOUR_MS = 60 * 60 * 1000;
const POLL_CHECK_MS = 60 * 1000;
const MAX_ARTICLES = 5;
const MIN_ARTICLES = 3;

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

const HOLDING_NAME_ALIASES: Record<string, string[]> = {
  AAPL: ['Apple', 'Apple Inc'],
  MSFT: ['Microsoft', 'Microsoft Corp', 'Microsoft Corporation'],
  NVDA: ['NVIDIA', 'Nvidia', 'NVIDIA Corp', 'NVIDIA Corporation'],
  BA: ['Boeing', 'Boeing Co', 'The Boeing Company'],
};

interface EventRegistryArticle {
  title?: string;
  body?: string;
  url?: string;
  dateTime?: string;
  date?: string;
  source?: {
    title?: string;
    uri?: string;
  };
}

interface ScoredArticle extends PortfolioNewsArticle {
  relevanceScore: number;
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function parseEventRegistryArticles(payload: unknown): EventRegistryArticle[] {
  if (Array.isArray(payload)) {
    return payload as EventRegistryArticle[];
  }

  if (payload && typeof payload === 'object') {
    const root = payload as Record<string, unknown>;
    const nestedResults = root.articles as
      | { results?: EventRegistryArticle[] }
      | EventRegistryArticle[]
      | undefined;

    if (Array.isArray(nestedResults)) {
      return nestedResults;
    }
    if (nestedResults && Array.isArray(nestedResults.results)) {
      return nestedResults.results;
    }
    if (Array.isArray(root.results)) {
      return root.results as EventRegistryArticle[];
    }
  }

  return [];
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

      const apiKey = process.env.EXPO_PUBLIC_NEWS_API_KEY?.trim().replace(/^['"]|['"]$/g, '');
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
        const holdingTerms = Array.from(
          new Set(
            focusedSymbols.flatMap((symbol) => [symbol, ...(HOLDING_NAME_ALIASES[symbol] ?? [])])
          )
        );
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const fetchEventRegistryArticles = async ({
          keywords,
          count = 50,
          includeBusinessSourcesOnly = true,
        }: {
          keywords: string[];
          count?: number;
          includeBusinessSourcesOnly?: boolean;
        }) => {
          const params = new URLSearchParams({
            resultType: 'articles',
            keywordOper: 'or',
            lang: 'eng',
            articlesSortBy: 'date',
            articlesPage: '1',
            articlesCount: String(count),
            dataType: 'news',
            dateStart: fromDate,
            apiKey,
          });
          if (includeBusinessSourcesOnly) {
            params.set('sourceGroupUri', 'business/top100');
          }
          keywords.forEach((keyword) => params.append('keyword', keyword));

          const response = await fetch(`${NEWS_API_BASE_URL}?${params.toString()}`);
          if (!response.ok) {
            let details = '';
            try {
              const errPayload: { message?: string; code?: string } = await response.json();
              if (errPayload?.message) details = `: ${errPayload.message}`;
              else if (errPayload?.code) details = `: ${errPayload.code}`;
            } catch {
              // Ignore parse failures and keep fallback status-only message.
            }
            throw new Error(`News API request failed (${response.status})${details}`);
          }
          const payload = await response.json();
          return parseEventRegistryArticles(payload);
        };

        const scoreArticles = (rawArticles: EventRegistryArticle[], strictBusinessFilter: boolean): ScoredArticle[] => {
          const developmentRegex = new RegExp(DEVELOPMENT_KEYWORDS.join('|'), 'i');
          return rawArticles
            .filter((article) => article.title && article.url && (article.dateTime || article.date))
            .map((article) => ({
              title: article.title as string,
              description: article.body ?? '',
              url: article.url as string,
              publishedAt: (article.dateTime || article.date) as string,
              sourceName: article.source?.title ?? article.source?.uri ?? 'News',
            }))
            .map((article) => {
              const haystack = `${article.title} ${article.description}`;
              const holdingMentions = holdingTerms.reduce((count, term) => {
                const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
                return count + (re.test(haystack) ? 1 : 0);
              }, 0);
              const developmentMentions = DEVELOPMENT_KEYWORDS.reduce((count, keyword) => {
                const re = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
                return count + (re.test(haystack) ? 1 : 0);
              }, 0);
              const titleHoldingBoost = holdingTerms.some((term) =>
                new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(article.title)
              )
                ? 2
                : 0;
              const relevanceScore = holdingMentions * 2 + developmentMentions + titleHoldingBoost;
              const hasHoldingMatch = holdingTerms.some((term) =>
                new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(haystack)
              );
              const hasBusinessSignal = developmentRegex.test(haystack);
              const passes = strictBusinessFilter
                ? hasHoldingMatch && hasBusinessSignal && relevanceScore >= 3
                : hasHoldingMatch && relevanceScore >= 2;
              return { ...article, relevanceScore, passes };
            })
            .filter((article) => article.passes)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
        };

        const strictRaw = await fetchEventRegistryArticles({
          keywords: [...holdingTerms, ...DEVELOPMENT_KEYWORDS],
          includeBusinessSourcesOnly: true,
          count: 50,
        });
        const strictArticles = scoreArticles(strictRaw, true);

        let fallbackArticles: ScoredArticle[] = [];
        if (strictArticles.length < MIN_ARTICLES) {
          const broadRaw = await fetchEventRegistryArticles({
            keywords: holdingTerms,
            includeBusinessSourcesOnly: true,
            count: 75,
          });
          fallbackArticles = scoreArticles(broadRaw, false);
        }

        if (strictArticles.length + fallbackArticles.length < MIN_ARTICLES) {
          const queryTerms = holdingTerms.slice(0, 8);
          for (const term of queryTerms) {
            const perTermRaw = await fetchEventRegistryArticles({
              keywords: [term],
              includeBusinessSourcesOnly: false,
              count: 50,
            });
            fallbackArticles = [...fallbackArticles, ...scoreArticles(perTermRaw, false)];
            const uniqueFallbackUrls = new Set(fallbackArticles.map((article) => article.url));
            if (strictArticles.length + uniqueFallbackUrls.size >= MIN_ARTICLES) break;
          }
        }

        const combined = [...strictArticles, ...fallbackArticles];
        const uniqueByUrl = new Map<string, PortfolioNewsArticle>();
        combined.forEach((article, index) => {
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
