import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// ─── Greenlight brand palette ─────────────────────────────────────────────────
const GL = {
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

// ─── Fake data ────────────────────────────────────────────────────────────────
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

  // Derived stats
  const positiveCount = useMemo(() => stocks.filter((s) => s.isPositive).length, [stocks]);
  const negativeCount = useMemo(() => stocks.filter((s) => !s.isPositive).length, [stocks]);

  return (
    <TabScreenLayout pageTitle="Watchlist">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Bento stat strip ────────────────────────────────────────────── */}
        <View style={styles.statStrip}>

          {/* Total watching — dark tile */}
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Watching</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{stocks.length}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>Stocks tracked</Text>
          </View>

          {/* Up — light tile */}
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Gaining</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{positiveCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>In the green</Text>
          </View>

          {/* Down — muted tile */}
          <View style={[styles.statTile, styles.startTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Declining</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{negativeCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>In the red</Text>
          </View>

        </View>

        {/* ── Section header ───────────────────────────────────────────────── */}
        {stocks.length > 0 && (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPip} />
            <Text style={styles.sectionTitle}>Starred Stocks</Text>
          </View>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {stocks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyGlyph}>☆</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>
              Star stocks from your portfolio or the search page to track them here.
            </Text>
          </View>
        )}

        {/* ── Stock list ───────────────────────────────────────────────────── */}
        {stocks.length > 0 && (
          <View style={styles.stockListWrapper}>
            <StockList
              stocks={watchlistWithStarred}
              onDelete={removeFromWatchlist}
              onAdd={(stock) => console.log('Add to portfolio', stock.symbol)}
              onStarPress={removeFromWatchlist}
            />
          </View>
        )}

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

  // ── Stat strip ────────────────────────────────────────────────────────────
  statStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
  },
  statTileDark: {
    backgroundColor: GL.green900,
  },
  statTileLight: {
    backgroundColor: GL.green100,
  },
  statTileMid: {
    backgroundColor: GL.green50,
    borderWidth: 1,
    borderColor: GL.green200,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 4,
  },
  statSub: {
    fontSize: 11,
    fontWeight: '400',
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

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 10,
  },
  emptyGlyph: {
    fontSize: 40,
    color: GL.green300,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GL.green900,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13,
    color: GL.dimGreen,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
});