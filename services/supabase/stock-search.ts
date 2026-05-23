import { STOCK_DEFAULTS, STOCK_NAME_ALIASES } from '@/data/stockLookup';
import { PortfolioHolding } from '@/data/mockPortfolio';
import { findAbbreviationsByAlias, normalizeAbbreviation } from '@/services/supabase/stock-catalog';
import { ensureStockByAbbreviation, searchStocks } from '@/services/supabase/stocks';

export interface ResolvedStockResult {
  symbol: string;
  displayName: string;
  currentPrice: number;
  yearlyChangePct: number;
}

function displayNameForSymbol(symbol: string): string {
  const aliases = STOCK_NAME_ALIASES[symbol];
  return aliases?.[0] ?? symbol;
}

function defaultsForSymbol(symbol: string): { currentPrice: number; yearlyChangePct: number } {
  return STOCK_DEFAULTS[symbol] ?? { currentPrice: 0, yearlyChangePct: 0 };
}

function resolveFromHoldings(
  query: string,
  holdings: PortfolioHolding[],
): ResolvedStockResult | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  for (const holding of holdings) {
    const symbol = normalizeAbbreviation(holding.symbol);
    const aliases = STOCK_NAME_ALIASES[symbol] ?? [];
    const candidates = [symbol, holding.symbol, ...aliases].map((value) => value.toLowerCase());

    if (candidates.some((candidate) => candidate === normalized || candidate.includes(normalized))) {
      return {
        symbol,
        displayName: displayNameForSymbol(symbol),
        currentPrice: holding.currentPrice,
        yearlyChangePct: holding.yearlyChangePct,
      };
    }
  }

  return null;
}

async function toResolvedResult(symbol: string, price: number, changePct: number): Promise<ResolvedStockResult> {
  const normalized = normalizeAbbreviation(symbol);
  try {
    await ensureStockByAbbreviation(normalized);
  } catch {
    // Stock exists; keep showing results even if the DB write fails.
  }
  return {
    symbol: normalized,
    displayName: displayNameForSymbol(normalized),
    currentPrice: price,
    yearlyChangePct: changePct,
  };
}

/** Search the Supabase `stocks` table and return the best match with mock/default pricing. */
export async function resolveStockFromDatabase(
  query: string,
  holdings: PortfolioHolding[],
): Promise<ResolvedStockResult | null> {
  const fromHoldings = resolveFromHoldings(query, holdings);
  if (fromHoldings) {
    return toResolvedResult(
      fromHoldings.symbol,
      fromHoldings.currentPrice,
      fromHoldings.yearlyChangePct,
    );
  }

  const matches = await searchStocks(query);
  if (matches.length > 0) {
    const normalized = query.trim().toLowerCase();
    const exact = matches.find(
      (stock) => normalizeAbbreviation(stock.abbreviation) === normalizeAbbreviation(query),
    );
    const aliasMatch = matches.find((stock) => {
      const symbol = normalizeAbbreviation(stock.abbreviation);
      const aliases = STOCK_NAME_ALIASES[symbol] ?? [];
      return aliases.some((alias) => alias.toLowerCase().includes(normalized));
    });

    const selected = exact ?? aliasMatch ?? matches[0];
    const symbol = normalizeAbbreviation(selected.abbreviation);
    const defaults = defaultsForSymbol(symbol);

    return toResolvedResult(symbol, defaults.currentPrice, defaults.yearlyChangePct);
  }

  const aliasAbbreviations = findAbbreviationsByAlias(query);
  if (aliasAbbreviations.length > 0) {
    const symbol = normalizeAbbreviation(aliasAbbreviations[0]);
    const defaults = defaultsForSymbol(symbol);
    return toResolvedResult(symbol, defaults.currentPrice, defaults.yearlyChangePct);
  }

  return null;
}
