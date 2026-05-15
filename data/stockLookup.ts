import { PortfolioHolding } from './mockPortfolio';

export const STOCK_NAME_ALIASES: Record<string, string[]> = {
  AAPL: ['Apple', 'Apple Inc'],
  MSFT: ['Microsoft', 'Microsoft Corp', 'Microsoft Corporation'],
  NVDA: ['NVIDIA', 'Nvidia', 'NVIDIA Corp', 'NVIDIA Corporation'],
  BA: ['Boeing', 'Boeing Co', 'The Boeing Company'],
  GOOGL: ['Google', 'Alphabet', 'Alphabet Inc'],
  AMZN: ['Amazon', 'Amazon.com'],
  TSLA: ['Tesla', 'Tesla Inc'],
  META: ['Meta', 'Facebook', 'Meta Platforms'],
};

/** Default mock prices for symbols not currently in the user's portfolio. */
export const STOCK_DEFAULTS: Record<string, { currentPrice: number; yearlyChangePct: number }> = {
  AAPL: { currentPrice: 198, yearlyChangePct: 12.1 },
  MSFT: { currentPrice: 425, yearlyChangePct: 17.8 },
  NVDA: { currentPrice: 946, yearlyChangePct: 71.2 },
  BA: { currentPrice: 184, yearlyChangePct: -6.4 },
  GOOGL: { currentPrice: 178, yearlyChangePct: 22.4 },
  AMZN: { currentPrice: 205, yearlyChangePct: 31.5 },
  TSLA: { currentPrice: 248, yearlyChangePct: 45.2 },
  META: { currentPrice: 585, yearlyChangePct: 38.7 },
};

export interface ResolvedStock {
  symbol: string;
  displayName: string;
  currentPrice: number;
  yearlyChangePct: number;
}

function sanitizeSymbol(symbol: string): string {
  return symbol.includes(':') ? symbol.split(':').pop()?.trim() ?? symbol : symbol.trim();
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function resolveStockSearch(query: string, holdings: PortfolioHolding[]): ResolvedStock | null {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  for (const holding of holdings) {
    const symbol = sanitizeSymbol(holding.symbol).toUpperCase();
    const aliases = STOCK_NAME_ALIASES[symbol] ?? [];
    const candidates = [symbol, holding.symbol, ...aliases].map((value) => value.toLowerCase());

    if (candidates.some((candidate) => candidate === normalized || candidate.includes(normalized))) {
      return {
        symbol,
        displayName: aliases[0] ?? symbol,
        currentPrice: holding.currentPrice,
        yearlyChangePct: holding.yearlyChangePct,
      };
    }
  }

  for (const [symbol, aliases] of Object.entries(STOCK_NAME_ALIASES)) {
    const candidates = [symbol, ...aliases].map((value) => value.toLowerCase());
    if (candidates.some((candidate) => candidate === normalized || candidate.includes(normalized))) {
      const defaults = STOCK_DEFAULTS[symbol];
      if (!defaults) continue;
      return {
        symbol,
        displayName: aliases[0] ?? symbol,
        currentPrice: defaults.currentPrice,
        yearlyChangePct: defaults.yearlyChangePct,
      };
    }
  }

  const upper = query.trim().toUpperCase();
  const defaults = STOCK_DEFAULTS[upper];
  if (defaults) {
    const aliases = STOCK_NAME_ALIASES[upper];
    return {
      symbol: upper,
      displayName: aliases?.[0] ?? upper,
      currentPrice: defaults.currentPrice,
      yearlyChangePct: defaults.yearlyChangePct,
    };
  }

  return null;
}

export function getSearchTermsForSymbol(symbol: string): string[] {
  const sanitized = sanitizeSymbol(symbol).toUpperCase();
  return Array.from(new Set([sanitized, ...(STOCK_NAME_ALIASES[sanitized] ?? [])]));
}
