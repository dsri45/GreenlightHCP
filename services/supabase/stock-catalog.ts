import { STOCK_NAME_ALIASES } from '@/data/stockLookup';

/** Hardcoded tickers used to seed the `stocks` table when empty. */
export const STOCK_CATALOG_ABBREVIATIONS = Object.keys(STOCK_NAME_ALIASES);

export function normalizeAbbreviation(abbreviation: string): string {
  const sanitized = abbreviation.includes(':')
    ? abbreviation.split(':').pop()?.trim() ?? abbreviation
    : abbreviation;
  return sanitized.trim().toUpperCase();
}

export function findAbbreviationsByAlias(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return STOCK_CATALOG_ABBREVIATIONS.filter((abbreviation) => {
    const aliases = STOCK_NAME_ALIASES[abbreviation] ?? [];
    const candidates = [abbreviation, ...aliases].map((value) => value.toLowerCase());
    return candidates.some(
      (candidate) => candidate === normalized || candidate.includes(normalized),
    );
  });
}
