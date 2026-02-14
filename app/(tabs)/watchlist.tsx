import { StockList, StockData } from '@/components/portfolio/StockList';
import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { Spacing } from '@/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

// Fake JSON data for watchlist stocks
const watchlistStocks: StockData[] = [
  {
    id: '1',
    symbol: 'AAPL',
    shares: 0,
    pricePerShare: '$175.50',
    logo: require('@/assets/images/icon.png'),
    isPositive: true,
  },
  {
    id: '2',
    symbol: 'GOOGL',
    shares: 0,
    pricePerShare: '$142.30',
    logo: require('@/assets/images/icon.png'),
    isPositive: false,
  },
  {
    id: '3',
    symbol: 'AMZN',
    shares: 0,
    pricePerShare: '$155.75',
    logo: require('@/assets/images/icon.png'),
    isPositive: true,
  },
  {
    id: '4',
    symbol: 'TSLA',
    shares: 0,
    pricePerShare: '$248.90',
    logo: require('@/assets/images/icon.png'),
    isPositive: false,
  },
  {
    id: '5',
    symbol: 'META',
    shares: 0,
    pricePerShare: '$485.20',
    logo: require('@/assets/images/icon.png'),
    isPositive: true,
  },
];

export default function WatchlistScreen() {
  return (
    <TabScreenLayout pageTitle="Watchlist">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StockList
          stocks={watchlistStocks}
          onDelete={(stock) => console.log('Remove from watchlist', stock.symbol)}
          onAdd={(stock) => console.log('Add to portfolio', stock.symbol)}
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
