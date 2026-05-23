import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeAbbreviation } from '@/services/supabase/stock-catalog';

function storageKey(userId: string): string {
  return `portfolio_shares_${userId}`;
}

export async function loadPortfolioShareCounts(
  userId: string,
): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export async function savePortfolioShareCounts(
  userId: string,
  counts: Record<string, number>,
): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(counts));
}

export async function clearPortfolioSharesForSymbol(
  userId: string,
  symbol: string,
): Promise<void> {
  const normalized = normalizeAbbreviation(symbol);
  const counts = await loadPortfolioShareCounts(userId);
  if (!(normalized in counts)) return;

  const next = { ...counts };
  delete next[normalized];
  await savePortfolioShareCounts(userId, next);
}
