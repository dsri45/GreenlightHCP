import { supabase } from '@/lib/supabase';
import { ensureStockByAbbreviation } from '@/services/supabase/stocks';
import type { DbUserToStockWithStock, InvestingType } from '@/services/supabase/types';

function oppositeInvestingType(investing: InvestingType): InvestingType {
  return investing === 'investing' ? 'watchlist' : 'investing';
}

async function removeConflictingMembership(
  userId: string,
  stockId: string,
  investing: InvestingType,
): Promise<void> {
  const { error } = await supabase
    .from('user_to_stocks')
    .delete()
    .eq('user_id', userId)
    .eq('stock_id', stockId)
    .eq('investing', oppositeInvestingType(investing));

  if (error) throw error;
}

export async function fetchUserStocks(
  userId: string,
  investing: InvestingType,
): Promise<DbUserToStockWithStock[]> {
  const { data, error } = await supabase
    .from('user_to_stocks')
    .select('user_to_stock_id, user_id, stock_id, investing, shares, stocks(stock_id, abbreviation)')
    .eq('user_id', userId)
    .eq('investing', investing);

  if (error) throw error;
  return (data ?? []) as unknown as DbUserToStockWithStock[];
}

async function getInvestingRow(userId: string, stockId: string) {
  const { data, error } = await supabase
    .from('user_to_stocks')
    .select('user_to_stock_id, shares')
    .eq('user_id', userId)
    .eq('stock_id', stockId)
    .eq('investing', 'investing')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function buyInvestingShares(
  userId: string,
  abbreviation: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;

  const stock = await ensureStockByAbbreviation(abbreviation);
  await removeConflictingMembership(userId, stock.stock_id, 'investing');

  const existing = await getInvestingRow(userId, stock.stock_id);
  if (existing) {
    const { error } = await supabase
      .from('user_to_stocks')
      .update({ shares: (existing.shares ?? 0) + count })
      .eq('user_to_stock_id', existing.user_to_stock_id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('user_to_stocks').insert({
    user_id: userId,
    stock_id: stock.stock_id,
    investing: 'investing',
    shares: count,
  });
  if (error) throw error;
}

export async function sellInvestingShares(
  userId: string,
  abbreviation: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;

  const stock = await ensureStockByAbbreviation(abbreviation);
  const existing = await getInvestingRow(userId, stock.stock_id);
  if (!existing) return;

  const currentShares = existing.shares ?? 0;
  const toSell = Math.min(count, currentShares);
  if (toSell <= 0) return;

  const remaining = currentShares - toSell;
  if (remaining <= 0) {
    const { error } = await supabase
      .from('user_to_stocks')
      .delete()
      .eq('user_to_stock_id', existing.user_to_stock_id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('user_to_stocks')
    .update({ shares: remaining })
    .eq('user_to_stock_id', existing.user_to_stock_id);
  if (error) throw error;
}

export async function upsertUserStock(
  userId: string,
  stockId: string,
  investing: InvestingType,
): Promise<void> {
  await removeConflictingMembership(userId, stockId, investing);

  const { data: existing, error: fetchError } = await supabase
    .from('user_to_stocks')
    .select('user_to_stock_id')
    .eq('user_id', userId)
    .eq('stock_id', stockId)
    .eq('investing', investing)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return;

  const { error } = await supabase.from('user_to_stocks').insert({
    user_id: userId,
    stock_id: stockId,
    investing,
    shares: 0,
  });
  if (error) throw error;
}

export async function addUserStockByAbbreviation(
  userId: string,
  abbreviation: string,
  investing: InvestingType,
): Promise<void> {
  if (investing === 'investing') {
    await buyInvestingShares(userId, abbreviation, 1);
    return;
  }

  const stock = await ensureStockByAbbreviation(abbreviation);
  await upsertUserStock(userId, stock.stock_id, 'watchlist');
}

export async function removeUserStockByAbbreviation(
  userId: string,
  abbreviation: string,
  investing?: InvestingType,
): Promise<void> {
  const stock = await ensureStockByAbbreviation(abbreviation);

  let query = supabase
    .from('user_to_stocks')
    .delete()
    .eq('user_id', userId)
    .eq('stock_id', stock.stock_id);

  if (investing) {
    query = query.eq('investing', investing);
  }

  const { error } = await query;
  if (error) throw error;
}
