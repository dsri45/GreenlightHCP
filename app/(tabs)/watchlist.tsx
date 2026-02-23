import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

// Fake JSON data for watchlist stocks
const initialWatchlistStocks: StockData[] = [
  { id: '1', symbol: 'AAPL', shares: 0, pricePerShare: '$175.50', logo: require('@/assets/images/icon.png'), isPositive: true },
  { id: '2', symbol: 'GOOGL', shares: 0, pricePerShare: '$142.30', logo: require('@/assets/images/icon.png'), isPositive: false },
  { id: '3', symbol: 'AMZN', shares: 0, pricePerShare: '$155.75', logo: require('@/assets/images/icon.png'), isPositive: true },
  { id: '4', symbol: 'TSLA', shares: 0, pricePerShare: '$248.90', logo: require('@/assets/images/icon.png'), isPositive: false },
  { id: '5', symbol: 'META', shares: 0, pricePerShare: '$485.20', logo: require('@/assets/images/icon.png'), isPositive: true },
];

export default function WatchlistScreen() {
  const [stocks, setStocks] = useState<StockData[]>(initialWatchlistStocks);

  const removeFromWatchlist = useCallback((stock: StockData) => {
    setStocks((prev) => prev.filter((s) => (s.id ?? s.symbol) !== (stock.id ?? stock.symbol)));
  }, []);

  const watchlistWithStarred = stocks.map((s) => ({ ...s, isStarred: true }));

  return (
    <TabScreenLayout pageTitle="Watchlist">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StockList
          stocks={watchlistWithStarred}
          onDelete={removeFromWatchlist}
          onAdd={(stock) => console.log('Add to portfolio', stock.symbol)}
          onStarPress={removeFromWatchlist}
        />
      </ScrollView>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
});
