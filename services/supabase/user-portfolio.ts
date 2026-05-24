import { supabase } from '@/lib/supabase';
import type { DbUserPortfolio } from '@/services/supabase/types';

export const DEFAULT_STARTING_CASH = 5000;

export class InsufficientFundsError extends Error {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds. You need $${required.toFixed(2)} but only have $${available.toFixed(2)} available.`,
    );
    this.name = 'InsufficientFundsError';
  }
}

export async function ensureUserPortfolio(userId: string): Promise<DbUserPortfolio> {
  const { error: upsertError } = await supabase.from('user_portfolio').upsert(
    { user_id: userId, money: DEFAULT_STARTING_CASH },
    { onConflict: 'user_id', ignoreDuplicates: true },
  );

  if (upsertError) throw upsertError;

  const { data, error } = await supabase
    .from('user_portfolio')
    .select('id, user_id, money')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserCashBalance(userId: string): Promise<number> {
  const portfolio = await ensureUserPortfolio(userId);
  return portfolio.money;
}

export async function adjustUserCash(userId: string, delta: number): Promise<number> {
  const portfolio = await ensureUserPortfolio(userId);
  const next = portfolio.money + delta;

  if (next < 0) {
    throw new InsufficientFundsError(Math.abs(delta), portfolio.money);
  }

  const { data, error } = await supabase
    .from('user_portfolio')
    .update({ money: next })
    .eq('user_id', userId)
    .select('money')
    .single();

  if (error) throw error;
  return data.money;
}
