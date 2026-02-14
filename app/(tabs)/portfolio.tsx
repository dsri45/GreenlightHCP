import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Mock stock data - in production, this would come from an API or state management
const stocks: StockData[] = [
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
          stocks={stocks}
          onDelete={(stock) => console.log('Delete', stock.symbol)}
          onAdd={(stock) => console.log('Add', stock.symbol)}
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

