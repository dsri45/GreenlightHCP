import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { NewsRow } from '@/components/search/NewsRow';
import { SearchBar } from '@/components/search/SearchBar';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { buildOneYearPortfolioChartData } from '@/data/mockPortfolio';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { usePortfolioHoldings } from '@/hooks/use-portfolio-holdings';
import { usePortfolioNews } from '@/hooks/use-portfolio-news';
import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
  const colors = usePortfolioColors();
  const [query, setQuery] = useState('');
  const { holdings } = usePortfolioHoldings();
  const { articles, loading: newsLoading, error: newsError, getAgeLabel } = usePortfolioNews(holdings);
  const oneYearPortfolioData = useMemo(() => buildOneYearPortfolioChartData(holdings), [holdings]);
  const totalPortfolioValue = useMemo(
    () => holdings.reduce((sum, stock) => sum + stock.currentPrice * stock.shares, 0),
    [holdings]
  );

  return (
    <TabScreenLayout pageTitle="Search">
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Portfolio Growth Graph Card */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>Portfolio Growth (1Y)</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                // Later: route to stock details screen
              }}
              style={[styles.moreButton, { backgroundColor: colors.primaryGreen }]}
            >
              <Text style={[Typography.small, { color: colors.white }]}>View more details</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: Spacing.sm }}>
            <PortfolioGraph initialPeriod="1Y" periods={['1Y']} dataByPeriod={{ '1Y': oneYearPortfolioData }} />
          </View>

          <View style={{ marginTop: Spacing.md }}>
            <Text style={[Typography.bodyMedium, { color: colors.primaryGreen }]}>
              Total portfolio value: ${totalPortfolioValue.toFixed(2)}
            </Text>
            <Text style={[Typography.small, { color: colors.textSecondary }]}>
              Calculated from current holdings in your portfolio.
            </Text>
          </View>
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Stock X" />

        {/* News List */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>News</Text>

          {newsLoading && (
            <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              Loading portfolio news...
            </Text>
          )}

          {!newsLoading && newsError && (
            <Text style={[Typography.small, { color: colors.errorRed, marginTop: Spacing.md }]}>{newsError}</Text>
          )}

          {!newsLoading && !newsError && articles.length === 0 && (
            <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              No major portfolio-related developments found right now.
            </Text>
          )}

          {!newsError &&
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
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
    gap: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  moreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
});