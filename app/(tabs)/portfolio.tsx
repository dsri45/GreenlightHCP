import { PortfolioGraph } from '@/components/portfolio';
import { SwipeableStock } from '@/components/portfolio/SwipeableStock';
import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock stock data - in production, this would come from an API or state management
const stocks: Array<{
  symbol: string;
  shares: number;
  pricePerShare: string;
  logo: ImageSourcePropType;
  isPositive: boolean;
}> = [
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={[Typography.brand, styles.brandText, { color: colors.greenlightBrand }]}>Greenlight</Text>
        </View>
        <View style={styles.portfolioTitleContainer}>
          <Text style={[Typography.h1, { color: colors.textPrimary }]}>Portfolio</Text>
        </View>
      </View>

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
        <View style={styles.stocksContainer}>
          {stocks.map((stock, index) => (
            <SwipeableStock
              key={`${stock.symbol}-${index}`}
              symbol={stock.symbol}
              shares={stock.shares}
              pricePerShare={stock.pricePerShare}
              logo={stock.logo}
              isPositive={stock.isPositive}
              onDelete={() => console.log('Delete', stock.symbol)}
              onAdd={() => console.log('Add', stock.symbol)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  brandContainer: {
    width: 191,
    height: 51,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandText: {
    textAlign: 'center',
  },
  portfolioTitleContainer: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
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
  stocksContainer: {
    gap: Spacing.md,
  },
  sectionTitleBold: {
    fontWeight: '700',
  },
});

