import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Mock stock data - in production, this would come from an API or state management
const initialStocks: StockData[] = [
  {
    symbol: 'MSFT',
    shares: 3,
    pricePerShare: '$100.00',
    logo: require('@/assets/images/icon.png'), // Replace with actual stock logos
    isPositive: true,
  },
  {
    symbol: 'NYSE: BA',
    shares: 3,
    pricePerShare: '$100.00',
    logo: require('@/assets/images/icon.png'),
    isPositive: true,
  },
  {
    symbol: 'NVDA',
    shares: 3,
    pricePerShare: '$100.00',
    logo: require('@/assets/images/icon.png'),
    isPositive: false,
  },
  {
    symbol: 'APPL',
    shares: 3,
    pricePerShare: '$100.00',
    logo: require('@/assets/images/icon.png'),
    isPositive: true,
  },
];

export default function PortfolioScreen() {
  const colors = usePortfolioColors();
  const [stocks, setStocks] = useState<StockData[]>(initialStocks);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set(['MSFT', 'NVDA']));

  const toggleWatchlist = useCallback((stock: StockData) => {
    setWatchlistSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(stock.symbol)) next.delete(stock.symbol);
      else next.add(stock.symbol);
      return next;
    });
  }, []);

  const handleDeleteStock = useCallback((stock: StockData) => {
    setStocks((prev) => prev.filter((s) => s.symbol !== stock.symbol));
    setWatchlistSymbols((prev) => {
      const next = new Set(prev);
      next.delete(stock.symbol);
      return next;
    });
  }, []);

  const stocksWithStarred = stocks.map((s) => ({
    ...s,
    isStarred: watchlistSymbols.has(s.symbol),
  }));

  return (
    <TabScreenLayout pageTitle="Portfolio">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Portfolio Graph */}
        <View style={styles.graphContainer}>
          <PortfolioGraph />
        </View>

        {/* Your Stocks Section */}
        <Text style={[Typography.sectionTitle, styles.sectionTitleBold, { color: colors.textPrimary, marginBottom: Spacing.md }]}>Your Stocks</Text>

        {/* Stock List */}
        <StockList
          stocks={stocksWithStarred}
          onDelete={handleDeleteStock}
          onAdd={(stock) => console.log('Add', stock.symbol)}
          onStarPress={toggleWatchlist}
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
    paddingBottom: Spacing.xxxl,
  },
  graphContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  sectionTitleBold: {
    fontWeight: '700',
  },
});

