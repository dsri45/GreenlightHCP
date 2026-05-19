import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { NewsRow } from '@/components/search/NewsRow';
import { PredictionModal } from '@/components/search/PredictionModal';
import { SearchBar } from '@/components/search/SearchBar';
import { Spacing } from '@/constants/theme';
import { buildOneYearPortfolioChartData, buildOneYearStockChartData } from '@/data/mockPortfolio';
import { useResolvedStock } from '@/hooks/use-resolved-stock';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { usePortfolioNews } from '@/hooks/use-portfolio-news';
import { fetchStockPrediction, StockPrediction } from '@/services/claude-prediction';
import React, { useCallback, useMemo, useState } from 'react';
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

export default function SearchScreen() {
  const colors = usePortfolioColors();
  const [query, setQuery] = useState('');
  const [predictionVisible, setPredictionVisible] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const { holdings } = usePortfolioHoldings();

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
    return buildOneYearPortfolioChartData(holdings);
  }, [holdings, resolvedStock]);

  const totalPortfolioValue = useMemo(
    () => holdings.reduce((sum, stock) => sum + stock.currentPrice * stock.shares, 0),
    [holdings]
  );

  // ── Derived display values ───────────────────────────────────────────────
  const graphTitle = isStockSearch
    ? `${resolvedStock!.symbol} · 1Y Price`
    : 'Portfolio · 1Y Growth';

  const primaryMetricLabel = isStockSearch ? 'Current price' : 'Total value';
  const primaryMetricValue = isStockSearch
    ? `$${resolvedStock!.currentPrice.toFixed(2)}`
    : `$${totalPortfolioValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  const changeValue = isStockSearch
    ? resolvedStock!.yearlyChangePct
    : holdings.reduce((sum, h) => sum + h.yearlyChangePct, 0) / Math.max(holdings.length, 1);
  const changeLabel = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(1)}% ${searchSource === 'finnhub' ? 'today' : 'this year'}`;
  
  const secondaryMetricLabel = isStockSearch ? 'Ticker' : 'Holdings';
  const secondaryMetricValue = isStockSearch ? resolvedStock!.symbol : `${holdings.length}`;
  const secondaryMetricSub = isStockSearch ? resolvedStock!.displayName : 'Active positions';

  const newsSectionTitle = isStockSearch
    ? `${resolvedStock!.displayName} News`
    : 'Market News';

  // ── Prediction handler ───────────────────────────────────────────────────
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
    <Text style={styles.unresolvedText}>
      No match for &ldquo;{trimmedQuery}&rdquo;. Try a ticker (e.g. AAPL) or company name.
    </Text>
  </View>
)}

        {/* ── Bento grid (hidden when query is unresolved) ────────────────── */}
        {!hasUnresolvedQuery && !searchLoading && (
  <View style={styles.bento}>

            {/* Row 1: two stat tiles side-by-side */}
            <View style={styles.bentoRow}>

              {/* Primary: value + change — dark green tile */}
              <View style={[styles.tile, styles.tileDark, { flex: 1.1 }]}>
                <Text style={[styles.tileLabel, { color: GL.green400 }]}>
                  {primaryMetricLabel}
                </Text>
                <Text style={[styles.tileValue, { color: GL.white }]}>
                  {primaryMetricValue}
                </Text>
                <View style={styles.changePill}>
                  <Text style={styles.changePillText}>{changeLabel}</Text>
                </View>
              </View>

              {/* Secondary: holdings / ticker — light green tile */}
              <View style={[styles.tile, styles.tileLight, { flex: 0.9 }]}>
                <Text style={[styles.tileLabel, { color: GL.green400 }]}>
                  {secondaryMetricLabel}
                </Text>
                <Text style={[styles.tileValue, { color: GL.white }]}>
                  {secondaryMetricValue}
                </Text>
                <Text style={styles.tileSub}>{secondaryMetricSub}</Text>
              </View>

            </View>

            {/* Row 2: chart tile — full width, mid-green */}
            <View style={[styles.tile, styles.tileMid, styles.tileWide]}>
              <Text style={styles.chartTileTitle}>{graphTitle}</Text>
              <View style={styles.graphWrapper}>
                <PortfolioGraph
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

        {/* ── News section ────────────────────────────────────────────────── */}
        <View style={styles.newsSection}>

          {/* Section header */}
          <View style={styles.newsSectionHeader}>
            <View style={styles.newsPip} />
            <Text style={styles.newsSectionTitle}>{newsSectionTitle}</Text>
          </View>

          {/* States */}
          {hasUnresolvedQuery && (
            <Text style={styles.newsStateText}>
              Enter a recognized stock or company to see related news.
            </Text>
          )}
          {!hasUnresolvedQuery && newsLoading && (
            <Text style={styles.newsStateText}>
              {isStockSearch ? 'Loading company news…' : 'Loading portfolio news…'}
            </Text>
          )}
          {!hasUnresolvedQuery && !newsLoading && newsError && (
            <Text style={[styles.newsStateText, { color: colors.errorRed }]}>{newsError}</Text>
          )}
          {!hasUnresolvedQuery && !newsLoading && !newsError && articles.length === 0 && (
            <Text style={styles.newsStateText}>
              {isStockSearch
                ? `No recent news found for ${resolvedStock!.displayName}.`
                : 'No major portfolio-related developments right now.'}
            </Text>
          )}

          {/* Article list */}
          {!hasUnresolvedQuery &&
            !newsError &&
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
                    ageLabel={`${article.sourceName} · ${getAgeLabel(article.publishedAt)}`}
                    logo={require('@/assets/images/icon.png')}
                    onPress={() => { void Linking.openURL(article.url); }}
                  />
                </View>
              </View>
            ))}
        </View>

      </ScrollView>

      <PredictionModal
        visible={predictionVisible}
        loading={predictionLoading}
        error={predictionError}
        prediction={prediction}
        onClose={() => setPredictionVisible(false)}
      />
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
  chartTileTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green700,
    marginBottom: 8,
  },
  graphWrapper: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
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