import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { BuySharesModal } from '@/components/portfolio/ShareTradeModals';
import { StockData, StockList } from '@/components/portfolio/StockList';
import { Spacing } from '@/constants/theme';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { useWatchlist } from '@/hooks/use-watchlist';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const GL = {
  green900: '#0A2E1A',
  green400: '#4ADE80',
  green300: '#86EFAC',
  white: '#FFFFFF',
  dimGreen: '#6B9E7A',
};

export default function WatchlistScreen() {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { holdings, cash, buyShares } = usePortfolioHoldings();
  const [buyStock, setBuyStock] = useState<StockData | null>(null);
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

  const positiveCount = useMemo(
    () => watchlist.filter((s: StockData) => s.isPositive).length,
    [watchlist],
  );
  const negativeCount = useMemo(
    () => watchlist.filter((s: StockData) => !s.isPositive).length,
    [watchlist],
  );

  const openBuyModal = useCallback((stock: StockData) => {
    setBuyStock(stock);
    setQuantity('1');
    setActionError(null);
  }, []);

  const closeBuyModal = useCallback(() => {
    setBuyStock(null);
    setQuantity('1');
    setActionError(null);
  }, []);

  const parsePricePerShare = (priceString: string) => {
    const sanitized = priceString.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(sanitized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const parsedQuantity = parseInt(quantity, 10);

  const handleBuyShares = useCallback(async () => {
    if (!buyStock) return;
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setActionError('Enter a valid share quantity');
      return;
    }

    const price = buyStock.currentPrice ?? parsePricePerShare(buyStock.pricePerShare);
    const totalCost = parsedQuantity * price;
    if (totalCost > cash) {
      setActionError(
        `Insufficient funds. You need $${totalCost.toFixed(2)} but only have $${cash.toFixed(2)} available.`,
      );
      return;
    }

    closeBuyModal();
    const result = await buyShares(
      buyStock.symbol,
      parsedQuantity,
      price,
      buyStock.yearlyChangePct ?? 0,
    );

    if (!result.ok) {
      setActionError(result.error);
      setBuyStock(buyStock);
      return;
    }
  }, [buyShares, buyStock, cash, closeBuyModal, parsePricePerShare, parsedQuantity]);

  const openInSearch = useCallback((stock: StockData) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { q: stock.symbol },
    });
  }, []);

  const buyPrice = buyStock
    ? buyStock.currentPrice ?? parsePricePerShare(buyStock.pricePerShare)
    : 0;

  return (
    <TabScreenLayout pageTitle="Watchlist">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statStrip}>
          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Watching</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{watchlist.length}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>Stocks tracked</Text>
          </View>

          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Gaining</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{positiveCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>In the green</Text>
          </View>

          <View style={[styles.statTile, styles.statTileDark]}>
            <Text style={[styles.statLabel, { color: GL.green400 }]}>Declining</Text>
            <Text style={[styles.statValue, { color: GL.white }]}>{negativeCount}</Text>
            <Text style={[styles.statSub, { color: GL.dimGreen }]}>In the red</Text>
          </View>
        </View>

        {watchlist.length > 0 && (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPip} />
            <Text style={styles.sectionTitle}>Starred Stocks</Text>
          </View>
        )}

        {watchlist.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyGlyph}>☆</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>
              Star stocks from your portfolio or the search page to track them here.
            </Text>
          </View>
        )}

        {watchlist.length > 0 && (
          <View style={styles.stockListWrapper}>
            <StockList
              stocks={watchlistWithStarred}
              onDelete={(stock) => removeFromWatchlist(stock.symbol)}
              onStarPress={(stock) => removeFromWatchlist(stock.symbol)}
              onPress={openInSearch}
              onBuyPress={openBuyModal}
            />
          </View>
        )}
      </ScrollView>

      <BuySharesModal
        visible={Boolean(buyStock)}
        symbol={buyStock?.symbol ?? ''}
        pricePerShare={buyPrice}
        cashAvailable={cash}
        quantity={quantity}
        error={actionError}
        onQuantityChange={setQuantity}
        onBuy={() => void handleBuyShares()}
        onClose={closeBuyModal}
      />
    </TabScreenLayout>
  );
}

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
    backgroundColor: '#22C55E',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green400,
  },
  stockListWrapper: {
    width: '100%',
  },
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
