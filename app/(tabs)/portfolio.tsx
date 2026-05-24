import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioAnalytics, PortfolioGraph } from '@/components/portfolio';
import { SellSharesModal } from '@/components/portfolio/ShareTradeModals';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import {
  buildPortfolioChartDataByPeriod,
  computePortfolioAnalytics,
  getAvailableChartPeriods,
  getDefaultChartPeriod,
} from '@/data/mockPortfolio';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { useUserCreatedAt } from '@/hooks/use-user-created-at';
import { useWatchlist } from '@/hooks/use-watchlist';
import { DEFAULT_STARTING_CASH } from '@/services/supabase/user-portfolio';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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
  const { holdings, cash, totalValue, addShare, sellShares } = usePortfolioHoldings();
  const { watchlist } = useWatchlist();
  const { createdAt: accountCreatedAt } = useUserCreatedAt();
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [actionError, setActionError] = useState<string | null>(null);

  const availableChartPeriods = useMemo(
    () => getAvailableChartPeriods(accountCreatedAt),
    [accountCreatedAt],
  );

  const defaultChartPeriod = useMemo(
    () => getDefaultChartPeriod(availableChartPeriods),
    [availableChartPeriods],
  );

  const chartDataByPeriod = useMemo(
    () => buildPortfolioChartDataByPeriod(holdings, cash, DEFAULT_STARTING_CASH, accountCreatedAt),
    [holdings, cash, accountCreatedAt],
  );
  const analytics = useMemo(
    () => computePortfolioAnalytics(holdings, cash, DEFAULT_STARTING_CASH),
    [holdings, cash],
  );

  const selectedHolding = selectedStock
    ? holdings.find((holding) => holding.symbol === selectedStock.symbol)
    : undefined;

  const parsedQuantity = parseInt(quantity, 10);

  const handleAddStock = useCallback(
    async (stock: StockData) => {
      const price = stock.currentPrice ?? 0;
      const result = await addShare(stock.symbol, price);
      if (!result.ok) {
        Alert.alert('Cannot buy', result.error);
      }
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

  const handleSellShares = useCallback(async () => {
    if (!selectedStock || !selectedHolding) return;
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setActionError('Enter a valid share quantity');
      return;
    }
    if (parsedQuantity > selectedHolding.shares) {
      setActionError(`You only have ${selectedHolding.shares} shares to sell`);
      return;
    }

    const price = selectedHolding.currentPrice;
    const result = await sellShares(selectedStock.symbol, parsedQuantity, price);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    closeModal();
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

  const formatMoney = (value: number) =>
    `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <TabScreenLayout pageTitle="Portfolio">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Top bento strip: account balance + money to invest ─────────── */}
        <View style={styles.statStrip}>
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Account balance</Text>
            <Text style={[styles.statValue, styles.statValueCompact, { color: GL.white }]}>
              {formatMoney(totalValue)}
            </Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>
              {holdings.length} {holdings.length === 1 ? 'position' : 'positions'} · {watchlistCount} watchlist
            </Text>
          </View>

          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Money to invest</Text>
            <Text style={[styles.statValue, styles.statValueCompact, { color: GL.white }]}>
              {formatMoney(cash)}
            </Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>Uninvested cash</Text>
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
                initialPeriod={defaultChartPeriod}
                periods={availableChartPeriods}
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

      <SellSharesModal
        visible={Boolean(selectedStock)}
        symbol={selectedStock?.symbol ?? ''}
        ownedShares={selectedHolding?.shares ?? 0}
        pricePerShare={selectedHolding?.currentPrice ?? 0}
        quantity={quantity}
        error={actionError}
        onQuantityChange={setQuantity}
        onSell={() => void handleSellShares()}
        onClose={closeModal}
      />
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
  statValueCompact: {
    fontSize: 22,
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
    gap: 8,
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
});