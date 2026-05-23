import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioAnalytics, PortfolioGraph } from '@/components/portfolio';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import {
  buildPortfolioChartDataByPeriod,
  computePortfolioAnalytics,
} from '@/data/mockPortfolio';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { useWatchlist } from '@/hooks/use-watchlist';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const { holdings, addShare, sellShares } = usePortfolioHoldings();
  const { watchlist } = useWatchlist();
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [actionError, setActionError] = useState<string | null>(null);

  const chartDataByPeriod = useMemo(() => buildPortfolioChartDataByPeriod(holdings), [holdings]);
  const analytics = useMemo(() => computePortfolioAnalytics(holdings), [holdings]);

  const selectedHolding = selectedStock
    ? holdings.find((holding) => holding.symbol === selectedStock.symbol)
    : undefined;

  const parsedQuantity = parseInt(quantity, 10);

  const handleAddStock = useCallback(
    (stock: StockData) => {
      addShare(stock.symbol);
    },
    [addShare],
  );

  const openSellModal = useCallback((stock: StockData) => {
    setSelectedStock(stock);
    setQuantity('1');
    setActionError(null);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedStock(null);
    setQuantity('1');
    setActionError(null);
  }, []);

  const handleSellShares = useCallback(() => {
    if (!selectedStock || !selectedHolding) return;
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setActionError('Enter a valid share quantity');
      return;
    }
    if (parsedQuantity > selectedHolding.shares) {
      setActionError(`You only have ${selectedHolding.shares} shares to sell`);
      return;
    }

    void sellShares(selectedStock.symbol, parsedQuantity).then(closeModal);
  }, [closeModal, parsedQuantity, selectedHolding, selectedStock, sellShares]);

  const stocks = useMemo<StockData[]>(
    () =>
      holdings.map((holding) => ({
        symbol: holding.symbol,
        shares: holding.shares,
        pricePerShare: `$${holding.currentPrice.toFixed(2)}`,
        logo: require('@/assets/images/icon.png'),
        isPositive: holding.yearlyChangePct >= 0,
        isOwned: true,
        currentPrice: holding.currentPrice,
        yearlyChangePct: holding.yearlyChangePct,
      })),
    [holdings],
  );

  const watchlistCount = watchlist.length;
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
                embedded
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
            stocks={stocks}
            onAdd={handleAddStock}
            onSellPress={openSellModal}
          />
        </View>

      </ScrollView>

      <Modal visible={Boolean(selectedStock)} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {selectedStock ? `Sell ${selectedStock.symbol}` : 'Sell shares'}
            </Text>
            <Text style={styles.modalSubtitle}>
              You own {selectedHolding?.shares ?? 0}{' '}
              {selectedHolding?.shares === 1 ? 'share' : 'shares'}.
            </Text>

            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Number of shares"
              placeholderTextColor={GL.green300}
              style={styles.modalInput}
            />

            {actionError ? <Text style={styles.modalError}>{actionError}</Text> : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={closeModal}
                style={[styles.modalButton, styles.cancelButton]}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSellShares}
                style={[styles.modalButton, styles.sellButton]}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Sell</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    minHeight: 280,
    width: '100%',
  },
  graphColumn: {
    flex: 1,
    minWidth: 0,
    padding: 5,
    alignSelf: 'stretch',
  },
  analyticsColumn: {
    flexShrink: 0,
    alignSelf: 'stretch',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    backgroundColor: GL.white,
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: GL.green100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GL.green900,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: GL.dimGreen,
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: GL.green200,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: GL.green900,
    marginBottom: Spacing.sm,
  },
  modalError: {
    color: '#B91C1C',
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: GL.green100,
  },
  cancelButtonText: {
    color: GL.green800,
    fontWeight: '700',
  },
  sellButton: {
    backgroundColor: '#DC2626',
  },
  modalButtonText: {
    color: GL.white,
    fontWeight: '700',
  },
});