import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioAnalytics, PortfolioGraph } from '@/components/portfolio';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import {
  buildPortfolioChartDataByPeriod,
  computePortfolioAnalytics,
} from '@/data/mockPortfolio';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PortfolioScreen() {
  const colors = usePortfolioColors();
  const { holdings, addShare, removeHolding } = usePortfolioHoldings();
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set(['MSFT', 'NVDA']));

  const chartDataByPeriod = useMemo(() => buildPortfolioChartDataByPeriod(holdings), [holdings]);
  const analytics = useMemo(() => computePortfolioAnalytics(holdings), [holdings]);

  const toggleWatchlist = useCallback((stock: StockData) => {
    setWatchlistSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(stock.symbol)) next.delete(stock.symbol);
      else next.add(stock.symbol);
      return next;
    });
  }, []);

  const handleDeleteStock = useCallback((stock: StockData) => {
    removeHolding(stock.symbol);
    setWatchlistSymbols((prev) => {
      const next = new Set(prev);
      next.delete(stock.symbol);
      return next;
    });
  }, [removeHolding]);

  const handleAddStock = useCallback((stock: StockData) => {
    addShare(stock.symbol);
  }, [addShare]);

  const stocks = useMemo<StockData[]>(
    () =>
      holdings.map((holding) => ({
        symbol: holding.symbol,
        shares: holding.shares,
        pricePerShare: `$${holding.currentPrice.toFixed(2)}`,
        logo: require('@/assets/images/icon.png'),
        isPositive: holding.yearlyChangePct >= 0,
      })),
    [holdings]
  );

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
        <View style={styles.dashboardRow}>
          <View style={styles.graphColumn}>
            <PortfolioGraph
              compact
              showAxes
              showBorder={false}
              dataByPeriod={chartDataByPeriod}
            />
          </View>
          <View style={styles.analyticsColumn}>
            <PortfolioAnalytics analytics={analytics} />
          </View>
        </View>

        <Text
          style={[
            Typography.sectionTitle,
            styles.sectionTitleBold,
            { color: colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md },
          ]}
        >
          Your Stocks
        </Text>

        <StockList
          stocks={stocksWithStarred}
          onDelete={handleDeleteStock}
          onAdd={handleAddStock}
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
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: 280,
    width: '100%',
  },
  graphColumn: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  analyticsColumn: {
    width: 158,
    flexShrink: 0,
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  sectionTitleBold: {
    fontWeight: '700',
  },
});
