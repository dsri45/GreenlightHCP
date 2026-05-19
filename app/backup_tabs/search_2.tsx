import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { NewsRow } from '@/components/search/NewsRow';
import { PredictionModal } from '@/components/search/PredictionModal';
import { SearchBar } from '@/components/search/SearchBar';
import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { buildOneYearPortfolioChartData, buildOneYearStockChartData } from '@/data/mockPortfolio';
import { resolveStockSearch } from '@/data/stockLookup';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { usePortfolioNews } from '@/hooks/use-portfolio-news';
import { fetchStockPrediction, StockPrediction } from '@/services/claude-prediction';
import React, { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
  const colors = usePortfolioColors();
  const [query, setQuery] = useState('');
  const [predictionVisible, setPredictionVisible] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const { holdings } = usePortfolioHoldings();
  const trimmedQuery = query.trim();
  const resolvedStock = useMemo(
    () => (trimmedQuery ? resolveStockSearch(trimmedQuery, holdings) : null),
    [trimmedQuery, holdings]
  );
  const isStockSearch = Boolean(resolvedStock);
  const hasUnresolvedQuery = Boolean(trimmedQuery) && !resolvedStock;

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

  const graphTitle = isStockSearch
    ? `${resolvedStock!.symbol} Price (1Y)`
    : 'Portfolio Growth (1Y)';

  const graphSubtitle = isStockSearch ? (
    <>
      <Text style={[Typography.bodyMedium, { color: colors.primaryGreen }]}>
        Current price: ${resolvedStock!.currentPrice.toFixed(2)}
      </Text>
      <Text style={[Typography.small, { color: colors.textSecondary }]}>
        1-year change: {resolvedStock!.yearlyChangePct >= 0 ? '+' : ''}
        {resolvedStock!.yearlyChangePct.toFixed(1)}%
      </Text>
    </>
  ) : (
    <>
      <Text style={[Typography.bodyMedium, { color: colors.primaryGreen }]}>
        Total portfolio value: ${totalPortfolioValue.toFixed(2)}
      </Text>
      <Text style={[Typography.small, { color: colors.textSecondary }]}>
        Calculated from current holdings in your portfolio.
      </Text>
    </>
  );

  const newsSectionTitle = isStockSearch ? `${resolvedStock!.displayName} News` : 'News';

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
  }, [
    articles,
    hasUnresolvedQuery,
    holdings,
    isStockSearch,
    resolvedStock,
    totalPortfolioValue,
  ]);

  return (
    <TabScreenLayout pageTitle="Search">
      <ScrollView contentContainerStyle={styles.scroll}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search a stock or company" />

        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>{graphTitle}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void handleGetPrediction()}
              disabled={hasUnresolvedQuery || newsLoading}
              style={[
                styles.predictionButton,
                { backgroundColor: colors.primaryGreen },
                (hasUnresolvedQuery || newsLoading) && styles.predictionButtonDisabled,
              ]}
            >
              <Text style={[Typography.small, { color: colors.white }]}>Get prediction</Text>
            </TouchableOpacity>
          </View>

          {hasUnresolvedQuery && (
            <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              No match for &quot;{trimmedQuery}&quot;. Try a ticker (e.g. AAPL) or company name.
            </Text>
          )}

          <View style={styles.graphWrapper}>
            <PortfolioGraph
              initialPeriod="1Y"
              periods={['1Y']}
              dataByPeriod={{ '1Y': oneYearChartData }}
              showBorder={false}
            />
          </View>

          <View style={{ marginTop: Spacing.md }}>{graphSubtitle}</View>
        </View>

        <View style={styles.section}>
          <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>{newsSectionTitle}</Text>

          {hasUnresolvedQuery && (
            <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              Enter a recognized stock or company to see related news.
            </Text>
          )}

          {!hasUnresolvedQuery && newsLoading && (
            <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              {isStockSearch ? 'Loading company news...' : 'Loading portfolio news...'}
            </Text>
          )}

          {!hasUnresolvedQuery && !newsLoading && newsError && (
            <Text style={[Typography.small, { color: colors.errorRed, marginTop: Spacing.md }]}>{newsError}</Text>
          )}

          {!hasUnresolvedQuery && !newsLoading && !newsError && articles.length === 0 && (
            <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              {isStockSearch
                ? `No recent news found for ${resolvedStock!.displayName}.`
                : 'No major portfolio-related developments found right now.'}
            </Text>
          )}

          {!hasUnresolvedQuery &&
            !newsError &&
            articles.map((article) => (
              <NewsRow
                key={article.id}
                title={article.title}
                ageLabel={`${article.sourceName} · ${getAgeLabel(article.publishedAt)}`}
                logo={require('@/assets/images/icon.png')}
                onPress={() => {
                  void Linking.openURL(article.url);
                }}
              />
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

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
    gap: Spacing.lg,
  },
  section: {
    width: '100%',
    alignSelf: 'center',
  },
  graphWrapper: {
    marginTop: Spacing.sm,
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  predictionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  predictionButtonDisabled: {
    opacity: 0.5,
  },
});
