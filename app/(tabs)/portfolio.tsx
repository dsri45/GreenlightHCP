import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioAnalytics, PortfolioGraph } from '@/components/portfolio';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import {
  buildPortfolioChartDataByPeriod,
  computePortfolioAnalytics,
} from '@/data/mockPortfolio';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// ─── Greenlight brand palette ─────────────────────────────────────────────────
const GL = {
  green950: '#052010',
  green900: '#0A2E1A',
  green800: '#0F4526',
  green700: '#166534',
  green600: '#16A34A',
  green500: '#22C55E',
  green400: '#4ADE80',
  green300: '#86EFAC',
  green200: '#BBF7D0',
  green100: '#DCFCE7',
  green50:  '#F0FDF4',
  white:    '#FFFFFF',
  dimGreen: '#6B9E7A',
};

export default function PortfolioScreen() {
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

  const handleDeleteStock = useCallback(
    (stock: StockData) => {
      removeHolding(stock.symbol);
      setWatchlistSymbols((prev) => {
        const next = new Set(prev);
        next.delete(stock.symbol);
        return next;
      });
    },
    [removeHolding]
  );

  const handleAddStock = useCallback(
    (stock: StockData) => {
      addShare(stock.symbol);
    },
    [addShare]
  );

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

  const watchlistCount = watchlistSymbols.size;
  const totalPositions = holdings.length;

  return (
    <TabScreenLayout pageTitle="Portfolio">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Top bento strip: two quick-stat tiles ──────────────────────── */}
        <View style={styles.statStrip}>
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Positions</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{totalPositions}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>Active holdings</Text>
          </View>

          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Watchlist</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{watchlistCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>Starred stocks</Text>
          </View>
        </View>

        {/* ── Chart + analytics bento tile ────────────────────────────────── */}
        <View style={styles.chartTile}>
          <Text style={styles.chartTileLabel}>Performance overview</Text>
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
        </View>

        {/* ── Your Stocks section header ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionPip} />
          <Text style={styles.sectionTitle}>Your Stocks</Text>
        </View>

        {/* ── Stock list ───────────────────────────────────────────────────── */}
        <View style={styles.stockListWrapper}>
          <StockList
            stocks={stocksWithStarred}
            onDelete={handleDeleteStock}
            onAdd={handleAddStock}
            onStarPress={toggleWatchlist}
          />
        </View>

      </ScrollView>
    </TabScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: 8,
  },

  // ── Quick-stat strip ──────────────────────────────────────────────────────
  statStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },
  statTile: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  statTileDark: {
    backgroundColor: GL.green900,
  },
  statTileLight: {
    backgroundColor: GL.green100,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 6,
  },
  statSub: {
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Chart bento tile ──────────────────────────────────────────────────────
  chartTile: {
    backgroundColor: GL.green50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GL.green200,
    padding: 16,
    paddingBottom: 8,
  },
  chartTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green700,
    marginBottom: 10,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
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

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GL.green500,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green400,
  },

  // ── Stock list wrapper ────────────────────────────────────────────────────
  stockListWrapper: {
    width: '100%',
  },
});