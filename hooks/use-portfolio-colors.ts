import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Custom hook to get portfolio colors based on the current color scheme.
 * Provides type-safe access to the Colors object.
 */
export function usePortfolioColors() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  return Colors[colorScheme];
}

