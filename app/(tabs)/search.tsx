import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { BuySharesModal, SellSharesModal } from '@/components/portfolio/ShareTradeModals';
import { NewsRow } from '@/components/search/NewsRow';
import { PredictionModal } from '@/components/search/PredictionModal';
import { SearchBar } from '@/components/search/SearchBar';
import { Spacing } from '@/constants/theme';
import { buildOneYearPortfolioChartData, buildOneYearStockChartData } from '@/data/mockPortfolio';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { usePortfolioNews } from '@/hooks/use-portfolio-news';
import { useResolvedStock } from '@/hooks/use-resolved-stock';
import { useUserCreatedAt } from '@/hooks/use-user-created-at';
import { useWatchlist } from '@/hooks/use-watchlist';
import { fetchStockPrediction, StockPrediction } from '@/services/claude-prediction';
import { DEFAULT_STARTING_CASH } from '@/services/supabase/user-portfolio';
import { getStockLogoUri } from '@/utils/stock-logo';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


// ─── Greenlight brand palette ─────────────────────────────────────────────────
const GL = {
  // Deep greens — tiles, surfaces
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
  // Accents / neutrals
  white:    '#FFFFFF',
  dimGreen: '#6B9E7A',
};

function StockLogo({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const initials = symbol.slice(0, 1).toUpperCase();

  if (failed) {
    return (
      <View style={styles.companyLogoFallback}>
        <Text style={styles.companyLogoFallbackText}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: getStockLogoUri(symbol) }}
      style={styles.companyLogo}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
}

export default function SearchScreen() {
  const colors = usePortfolioColors();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState('');
  const [predictionVisible, setPredictionVisible] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState('1');
  const [buyError, setBuyError] = useState<string | null>(null);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellQuantity, setSellQuantity] = useState('1');
  const [sellError, setSellError] = useState<string | null>(null);
  const { holdings, cash, totalValue, buyShares, sellShares } = usePortfolioHoldings();
  const { createdAt: accountCreatedAt } = useUserCreatedAt();
  const { isWatched, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    if (typeof q === 'string' && q.trim()) {
      setQuery(q.trim());
    }
  }, [q]);

  const trimmedQuery = query.trim();
  const { stock: resolvedStock, loading: searchLoading, source: searchSource } = useResolvedStock(trimmedQuery, holdings);
  const isStockSearch = Boolean(resolvedStock);
  const hasUnresolvedQuery = Boolean(trimmedQuery) && !resolvedStock && !searchLoading;

  const { articles, loading: newsLoading, error: newsError, getAgeLabel } = usePortfolioNews(
    holdings,
    trimmedQuery
  );

  const oneYearChartData = useMemo(() => {
    if (resolvedStock) {
      return buildOneYearStockChartData({
        currentPrice: resolvedStock.currentPrice,
        yearlyChangePct: resolvedStock.yearlyChangePct,
      });
    }
    return buildOneYearPortfolioChartData(holdings, cash, DEFAULT_STARTING_CASH, accountCreatedAt);
  }, [accountCreatedAt, holdings, cash, resolvedStock]);

  const totalPortfolioValue = totalValue;

  // ── Derived display values ───────────────────────────────────────────────
  const graphTitle = isStockSearch
    ? `${resolvedStock!.symbol} · 1Y Price`
    : 'Portfolio · 1Y Growth';

  const changeValue = isStockSearch
    ? resolvedStock!.yearlyChangePct
    : holdings.reduce((sum, h) => sum + h.yearlyChangePct, 0) / Math.max(holdings.length, 1);
  const changeLabel = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(1)}% ${searchSource === 'finnhub' ? 'today' : 'this year'}`;

  const stockPrice = isStockSearch
    ? `$${resolvedStock!.currentPrice.toFixed(2)}`
    : `$${totalPortfolioValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  const ownedHolding = isStockSearch
    ? holdings.find((holding) => holding.symbol === resolvedStock!.symbol)
    : undefined;
  const stockIsOwned = Boolean(ownedHolding && ownedHolding.shares > 0);
  const stockIsWatched = isStockSearch && !stockIsOwned ? isWatched(resolvedStock!.symbol) : false;
  const handleToggleWatchlist = useCallback(() => {
    if (!isStockSearch) return;
    toggleWatchlist({
      symbol: resolvedStock!.symbol,
      currentPrice: resolvedStock!.currentPrice,
      yearlyChangePct: resolvedStock!.yearlyChangePct,
    });
  }, [isStockSearch, resolvedStock, toggleWatchlist]);

  const openBuyModal = useCallback(() => {
    setBuyQuantity('1');
    setBuyError(null);
    setBuyModalVisible(true);
  }, []);

  const closeBuyModal = useCallback(() => {
    setBuyModalVisible(false);
    setBuyQuantity('1');
    setBuyError(null);
  }, []);

  const openSellModal = useCallback(() => {
    setSellQuantity('1');
    setSellError(null);
    setSellModalVisible(true);
  }, []);

  const closeSellModal = useCallback(() => {
    setSellModalVisible(false);
    setSellQuantity('1');
    setSellError(null);
  }, []);

  const parsedBuyQuantity = parseInt(buyQuantity, 10);
  const parsedSellQuantity = parseInt(sellQuantity, 10);

  const handleBuyShares = useCallback(async () => {
    if (!isStockSearch || !resolvedStock) return;
    if (Number.isNaN(parsedBuyQuantity) || parsedBuyQuantity <= 0) {
      setBuyError('Enter a valid share quantity');
      return;
    }

    const price = resolvedStock.currentPrice;
    const totalCost = parsedBuyQuantity * price;
    if (totalCost > cash) {
      setBuyError(
        `Insufficient funds. You need $${totalCost.toFixed(2)} but only have $${cash.toFixed(2)} available.`,
      );
      return;
    }

    closeBuyModal();
    const result = await buyShares(
      resolvedStock.symbol,
      parsedBuyQuantity,
      price,
      resolvedStock.yearlyChangePct,
    );

    if (!result.ok) {
      setBuyError(result.error);
      setBuyModalVisible(true);
      return;
    }
  }, [buyShares, cash, closeBuyModal, isStockSearch, parsedBuyQuantity, resolvedStock]);

  const handleSellShares = useCallback(async () => {
    if (!isStockSearch || !resolvedStock || !ownedHolding) return;
    if (Number.isNaN(parsedSellQuantity) || parsedSellQuantity <= 0) {
      setSellError('Enter a valid share quantity');
      return;
    }
    if (parsedSellQuantity > ownedHolding.shares) {
      setSellError(`You only have ${ownedHolding.shares} shares to sell`);
      return;
    }

    const result = await sellShares(
      resolvedStock.symbol,
      parsedSellQuantity,
      ownedHolding.currentPrice,
    );

    if (!result.ok) {
      setSellError(result.error);
      return;
    }

    closeSellModal();
  }, [closeSellModal, isStockSearch, ownedHolding, parsedSellQuantity, resolvedStock, sellShares]);

  const newsSectionTitle = isStockSearch
    ? `${resolvedStock!.displayName} News`
    : 'Market News';

  // ── Prediction handler ───────────────────────────────────────────────────
  const handlePickPress = useCallback((symbol: string) => {
    setQuery(symbol);
  }, []);

  const handleGetPrediction = useCallback(async () => {
    if (hasUnresolvedQuery) return;

    const targetSymbol = isStockSearch ? resolvedStock!.symbol : 'PORTFOLIO';
    const targetName = isStockSearch ? resolvedStock!.displayName : 'Your Portfolio';
    const targetPrice = isStockSearch ? resolvedStock!.currentPrice : totalPortfolioValue;
    const targetChange = isStockSearch
      ? resolvedStock!.yearlyChangePct
      : holdings.reduce((sum, h) => sum + h.yearlyChangePct, 0) / Math.max(holdings.length, 1);

    setPredictionVisible(true);
    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);

    try {
      const result = await fetchStockPrediction({
        symbol: targetSymbol,
        companyName: targetName,
        currentPrice: targetPrice,
        yearlyChangePct: targetChange,
        articles,
        isPortfolio: !isStockSearch,
      });
      setPrediction(result);
    } catch {
      setPredictionError('Unable to generate a prediction right now. Please try again.');
    } finally {
      setPredictionLoading(false);
    }
  }, [articles, hasUnresolvedQuery, holdings, isStockSearch, resolvedStock, totalPortfolioValue]);

  return (
    <TabScreenLayout pageTitle="Search">
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search a stock or company"
        />

       {/* ── Loading state for Finnhub fallback ──────────────────────────── */}
{searchLoading && (
  <View style={styles.unresolvedBanner}>
    <View style={styles.unresolvedAccent} />
    <Text style={styles.unresolvedText}>
      Looking up &ldquo;{trimmedQuery.toUpperCase()}&rdquo;...
    </Text>
  </View>
)}

{/* ── Unresolved query notice ─────────────────────────────────────── */}
{hasUnresolvedQuery && (
  <View style={styles.unresolvedBanner}>
    <View style={styles.unresolvedAccent} />
    <Text style={styles.unresolvedText}>Stock doesn&apos;t exist.</Text>
  </View>
)}

        {/* ── Bento grid (stock results only) ─────────────────────────────── */}
        {isStockSearch && !searchLoading && (
  <View style={styles.bento}>

            {/* Company header */}
            <View style={styles.companyHeader}>
              <StockLogo symbol={resolvedStock!.symbol} />
              <View style={styles.companyHeaderText}>
                <Text style={styles.companyName} numberOfLines={2}>
                  {resolvedStock!.displayName}
                </Text>
                <Text style={styles.companySymbol}>{resolvedStock!.symbol}</Text>
              </View>
              <View style={styles.companyHeaderPrice}>
                <Text style={styles.companyPrice}>{stockPrice}</Text>
                <View style={styles.headerChangePill}>
                  <Text style={styles.headerChangePillText}>{changeLabel}</Text>
                </View>
              </View>
            </View>

            {/* Chart tile — full width, mid-green */}
            <View style={[styles.tile, styles.tileMid, styles.tileWide]}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTileTitle}>{graphTitle}</Text>
                <View style={styles.chartHeaderActions}>
                  {isStockSearch && !stockIsOwned && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleWatchlist}
                      style={[
                        styles.actionChip,
                        stockIsWatched ? styles.watchlistButtonActive : styles.watchlistButtonInactive,
                      ]}
                    >
                      <Text style={[styles.actionChipText, stockIsWatched && styles.watchlistButtonTextActive]}>
                        {stockIsWatched ? '★ Watching' : '☆ Watchlist'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {isStockSearch && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={openBuyModal}
                      style={[styles.actionChip, styles.buyButton]}
                    >
                      <Text style={styles.buyButtonText}>+ Buy</Text>
                    </TouchableOpacity>
                  )}
                  {isStockSearch && stockIsOwned && ownedHolding && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={openSellModal}
                      style={[styles.actionChip, styles.sellChipButton]}
                    >
                      <Text style={styles.sellButtonText}>Sell</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.graphWrapper}>
                <PortfolioGraph
                  compact
                  embedded
                  showAxes
                  initialPeriod="1Y"
                  periods={['1Y']}
                  dataByPeriod={{ '1Y': oneYearChartData }}
                  showBorder={false}
                />
              </View>
            </View>

            {/* Row 3: AI Prediction CTA — full width, vivid green */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => void handleGetPrediction()}
              disabled={newsLoading}
              style={[
                styles.tile,
                styles.tileWide,
                styles.tileCta,
                newsLoading && styles.tileCtaDisabled,
              ]}
            >
              <View style={styles.ctaInner}>
                <View style={styles.ctaIconRing}>
                  <Text style={styles.ctaIconGlyph}>✦</Text>
                </View>
                <View style={styles.ctaText}>
                  <Text style={styles.ctaTitle}>AI Prediction</Text>
                  <Text style={styles.ctaSub}>
                    {newsLoading
                      ? 'Loading market data…'
                      : 'Get a Claude-powered forecast for this position'}
                  </Text>
                </View>
                <Text style={styles.ctaArrow}>›</Text>
              </View>
            </TouchableOpacity>

          </View>
        )}

        {/* ── News section (stock results only) ───────────────────────────── */}
        {isStockSearch && !searchLoading && (
        <View style={styles.newsSection}>

          {/* Section header */}
          <View style={styles.newsSectionHeader}>
            <View style={styles.newsPip} />
            <Text style={styles.newsSectionTitle}>{newsSectionTitle}</Text>
          </View>

          {/* States */}
          {newsLoading && (
            <Text style={styles.newsStateText}>Loading company news…</Text>
          )}
          {!newsLoading && newsError && (
            <Text style={[styles.newsStateText, { color: colors.errorRed }]}>{newsError}</Text>
          )}
          {!newsLoading && !newsError && articles.length === 0 && (
            <Text style={styles.newsStateText}>
              No recent news found for {resolvedStock!.displayName}.
            </Text>
          )}

          {/* Article list */}
          {!newsError &&
            articles.map((article, idx) => (
              <View
                key={article.id}
                style={[
                  styles.newsRow,
                  idx === articles.length - 1 && styles.newsRowLast,
                ]}
              >
                {/* Numbered index */}
                <Text style={styles.newsIndex}>{String(idx + 1).padStart(2, '0')}</Text>

                {/* NewsRow component */}
                <View style={styles.newsRowContent}>
                  <NewsRow
                    title={article.title}
                    sourceName={article.sourceName}
                    ageLabel={getAgeLabel(article.publishedAt)}
                    onPress={() => { void Linking.openURL(article.url); }}
                  />
                </View>
              </View>
            ))}
        </View>
        )}

      </ScrollView>

      <PredictionModal
        visible={predictionVisible}
        loading={predictionLoading}
        error={predictionError}
        prediction={prediction}
        onClose={() => setPredictionVisible(false)}
        onPickPress={handlePickPress}
      />

      {isStockSearch && resolvedStock ? (
        <BuySharesModal
          visible={buyModalVisible}
          symbol={resolvedStock.symbol}
          pricePerShare={resolvedStock.currentPrice}
          cashAvailable={cash}
          quantity={buyQuantity}
          error={buyError}
          onQuantityChange={setBuyQuantity}
          onBuy={() => void handleBuyShares()}
          onClose={closeBuyModal}
        />
      ) : null}

      {isStockSearch && resolvedStock && ownedHolding ? (
        <SellSharesModal
          visible={sellModalVisible}
          symbol={resolvedStock.symbol}
          ownedShares={ownedHolding.shares}
          pricePerShare={ownedHolding.currentPrice}
          quantity={sellQuantity}
          error={sellError}
          onQuantityChange={setSellQuantity}
          onSell={() => void handleSellShares()}
          onClose={closeSellModal}
        />
      ) : null}
    </TabScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.lg,
  },

  // ── Unresolved banner ────────────────────────────────────────────────────
  unresolvedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: GL.green50,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 12,
    paddingRight: 14,
    paddingVertical: 12,
  },
  unresolvedAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: GL.green500,
    borderRadius: 0,
  },
  unresolvedText: {
    flex: 1,
    fontSize: 13,
    color: GL.green800,
    lineHeight: 18,
  },

  // ── Bento ────────────────────────────────────────────────────────────────
  bento: {
    gap: 8,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GL.green900,
    borderRadius: 16,
    padding: 16,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: GL.white,
  },
  companyLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: GL.green800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: GL.green200,
  },
  companyHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: GL.white,
    letterSpacing: -0.3,
  },
  companySymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: GL.green400,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  companyHeaderPrice: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
  },
  companyPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: GL.white,
    letterSpacing: -0.6,
  },
  headerChangePill: {
    marginTop: 6,
    backgroundColor: GL.green800,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: GL.green700,
  },
  headerChangePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: GL.green300,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tileWide: {
    width: '100%',
  },

  // Base tile
  tile: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },

  // Dark tile (primary metric)
  tileDark: {
    backgroundColor: GL.green900,
  },

  // Light tile (secondary metric)
  tileLight: {
    backgroundColor: GL.green900,
  },

  // Mid tile (chart)
  tileMid: {
    backgroundColor: GL.green50,
    borderWidth: 1,
    borderColor: GL.green200,
    overflow: 'visible',
  },

  // Stat tile typography
  tileLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  tileSub: {
    fontSize: 12,
    color: GL.green300,
    fontWeight: '400',
  },

  // Change pill inside dark tile
  changePill: {
    alignSelf: 'flex-start',
    backgroundColor: GL.green800,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: GL.green700,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: GL.green300,
  },

  // Chart tile
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  chartHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  chartTileTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green700,
    flexShrink: 0,
  },
  actionChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  watchlistButtonInactive: {
    borderColor: GL.green200,
    backgroundColor: GL.white,
  },
  watchlistButtonActive: {
    borderColor: GL.green500,
    backgroundColor: GL.green100,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: GL.green700,
  },
  watchlistButtonTextActive: {
    color: GL.green900,
  },
  buyButton: {
    borderColor: GL.green600,
    backgroundColor: GL.green600,
  },
  buyButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: GL.white,
  },
  sellChipButton: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  sellButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: GL.white,
  },
  graphWrapper: {
    width: '100%',
    minHeight: 220,
    padding: 0,
    alignSelf: 'stretch',
    overflow: 'hidden',
    marginTop: 4,
  },

  // CTA tile
  tileCta: {
    backgroundColor: GL.green600,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  tileCtaDisabled: {
    opacity: 0.5,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ctaIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaIconGlyph: {
    fontSize: 20,
    color: GL.white,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: GL.white,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  ctaSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 16,
  },
  ctaArrow: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 28,
    fontWeight: '300',
  },

  // ── News section ─────────────────────────────────────────────────────────
  newsSection: {
    paddingTop: 20,
    gap: 0,
  },
  newsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  newsPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GL.green500,
  },
  newsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green500,
  },
  newsStateText: {
    fontSize: 13,
    color: GL.dimGreen,
    lineHeight: 18,
    marginTop: 4,
  },

  // News rows
  newsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GL.green100,
  },
  newsRowLast: {
    borderBottomWidth: 0,
  },
  newsIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: GL.green400,
    letterSpacing: 0.5,
    marginTop: 2,
    width: 24,
    textAlign: 'right',
  },
  newsRowContent: {
    flex: 1,
  },
});