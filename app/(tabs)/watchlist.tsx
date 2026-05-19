import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
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

export default function WatchlistScreen() {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { holdings, buyShares, sellShares } = usePortfolioHoldings();
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [actionError, setActionError] = useState<string | null>(null);

  const watchlistWithStarred = watchlist.map((s: StockData) => {
    const holding = holdings.find((holding) => holding.symbol === s.symbol);
    return {
      ...s,
      isStarred: true,
      shares: holding?.shares ?? s.shares,
      pricePerShare: holding ? `$${holding.currentPrice.toFixed(2)}` : s.pricePerShare,
      currentPrice: holding?.currentPrice ?? s.currentPrice,
      yearlyChangePct: holding?.yearlyChangePct ?? s.yearlyChangePct,
    };
  });

  const selectedHolding = selectedStock
    ? holdings.find((holding) => holding.symbol === selectedStock.symbol)
    : undefined;

  const selectedShares = selectedHolding?.shares ?? 0;

  // Derived stats
  const positiveCount = useMemo(
    () => watchlist.filter((s: StockData) => s.isPositive).length,
    [watchlist]
  );
  const negativeCount = useMemo(
    () => watchlist.filter((s: StockData) => !s.isPositive).length,
    [watchlist]
  );

  const openStockModal = useCallback((stock: StockData) => {
    setSelectedStock(stock);
    setQuantity('1');
    setActionError(null);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedStock(null);
    setQuantity('1');
    setActionError(null);
  }, []);

  const parsePricePerShare = (priceString: string) => {
    const sanitized = priceString.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(sanitized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const parsedQuantity = parseInt(quantity, 10);

  const handleBuyShares = useCallback(() => {
    if (!selectedStock) return;
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setActionError('Enter a valid share quantity');
      return;
    }

    buyShares(
      selectedStock.symbol,
      parsedQuantity,
      selectedStock.currentPrice ?? parsePricePerShare(selectedStock.pricePerShare),
      selectedStock.yearlyChangePct ?? 0,
    );

    closeModal();
  }, [buyShares, closeModal, parsePricePerShare, parsedQuantity, selectedStock]);

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

    sellShares(selectedStock.symbol, parsedQuantity);
    closeModal();
  }, [closeModal, parsedQuantity, sellShares, selectedHolding, selectedStock]);

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
            <Text style={[styles.statValue, { color: GL.white }]}>{watchlist.length}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>Stocks tracked</Text>
          </View>

          {/* Up — light tile */}
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Gaining</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{positiveCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>In the green</Text>
          </View>

          {/* Down — muted tile */}
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Declining</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{negativeCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>In the red</Text>
          </View>

        </View>

        {/* ── Section header ───────────────────────────────────────────────── */}
        {watchlist.length > 0 && (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPip} />
            <Text style={styles.sectionTitle}>Starred Stocks</Text>
          </View>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {watchlist.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyGlyph}>☆</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>
              Star stocks from your portfolio or the search page to track them here.
            </Text>
          </View>
        )}

        {/* ── Stock list ───────────────────────────────────────────────────── */}
        {watchlist.length > 0 && (
          <View style={styles.stockListWrapper}>
            <StockList
              stocks={watchlistWithStarred}
              onDelete={removeFromWatchlist}
              onStarPress={removeFromWatchlist}
              onPress={openStockModal}
            />
          </View>
        )}

      </ScrollView>

      <Modal visible={Boolean(selectedStock)} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{selectedStock ? `Trade ${selectedStock.symbol}` : 'Trade stock'}</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStock?.symbol && selectedHolding?.shares
                ? `You currently hold ${selectedHolding.shares} shares.`
                : selectedStock
                ? 'Enter a quantity to buy.'
                : ''}
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
                onPress={handleBuyShares}
                style={[styles.modalButton, styles.buyButton]}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Buy</Text>
              </TouchableOpacity>
              {selectedHolding?.shares ? (
                <TouchableOpacity
                  onPress={handleSellShares}
                  style={[styles.modalButton, styles.sellButton]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Sell</Text>
                </TouchableOpacity>
              ) : null}
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

  // ── Modal
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
  buyButton: {
    backgroundColor: GL.green600,
  },
  sellButton: {
    backgroundColor: '#DC2626',
  },
  modalButtonText: {
    color: GL.white,
    fontWeight: '700',
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