import { supabase } from '@/lib/supabase';
import {
  findAbbreviationsByAlias,
  normalizeAbbreviation,
  STOCK_CATALOG_ABBREVIATIONS,
} from '@/services/supabase/stock-catalog';
import type { DbStock } from '@/services/supabase/types';

const STOCK_UPSERT_OPTIONS = { onConflict: 'abbreviation', ignoreDuplicates: true } as const;

export async function seedStocksFromCatalog(): Promise<void> {
  const abbreviations = [...new Set(STOCK_CATALOG_ABBREVIATIONS.map(normalizeAbbreviation))];
  if (abbreviations.length === 0) return;

  const { error } = await supabase.from('stocks').upsert(
    abbreviations.map((abbreviation) => ({ abbreviation })),
    STOCK_UPSERT_OPTIONS,
  );

  if (error) throw error;
}

export async function getStockByAbbreviation(abbreviation: string): Promise<DbStock | null> {
  const normalized = normalizeAbbreviation(abbreviation);
  const { data, error } = await supabase
    .from('stocks')
    .select('stock_id, abbreviation')
    .ilike('abbreviation', normalized)
    .order('stock_id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    stock_id: data.stock_id,
    abbreviation: normalizeAbbreviation(data.abbreviation),
  };
}

export async function getAllStocks(): Promise<DbStock[]> {
  const { data, error } = await supabase
    .from('stocks')
    .select('stock_id, abbreviation')
    .order('abbreviation');

  if (error) throw error;

  const byAbbreviation = new Map<string, DbStock>();
  for (const stock of data ?? []) {
    const key = normalizeAbbreviation(stock.abbreviation);
    if (!byAbbreviation.has(key)) {
      byAbbreviation.set(key, { stock_id: stock.stock_id, abbreviation: key });
    }
  }

  return Array.from(byAbbreviation.values()).sort((a, b) =>
    a.abbreviation.localeCompare(b.abbreviation),
  );
}

export async function ensureStockByAbbreviation(abbreviation: string): Promise<DbStock> {
  const normalized = normalizeAbbreviation(abbreviation);

  const { error } = await supabase
    .from('stocks')
    .upsert({ abbreviation: normalized }, STOCK_UPSERT_OPTIONS);

  if (error) throw error;

  const stock = await getStockByAbbreviation(normalized);
  if (!stock) {
    throw new Error(`Failed to resolve stock for abbreviation "${normalized}"`);
  }

  return stock;
}

export async function searchStocks(query: string): Promise<DbStock[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('stocks')
    .select('stock_id, abbreviation')
    .ilike('abbreviation', `%${trimmed}%`);

  if (error) throw error;

  const results = new Map<string, DbStock>();
  for (const stock of data ?? []) {
    const key = normalizeAbbreviation(stock.abbreviation);
    if (!results.has(key)) {
      results.set(key, { stock_id: stock.stock_id, abbreviation: key });
    }
  }

  for (const abbreviation of findAbbreviationsByAlias(trimmed)) {
    const stock = await getStockByAbbreviation(abbreviation);
    if (stock) results.set(stock.abbreviation, stock);
  }

  const exact = normalizeAbbreviation(trimmed);
  if (/^[A-Z]{1,5}$/.test(exact)) {
    const stock = await getStockByAbbreviation(exact);
    if (stock) results.set(stock.abbreviation, stock);
  }

  return Array.from(results.values()).sort((a, b) =>
    a.abbreviation.localeCompare(b.abbreviation),
  );
}
