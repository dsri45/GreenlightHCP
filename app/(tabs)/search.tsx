import { TabScreenLayout } from '@/components/layouts/TabScreenLayout';
import { PortfolioGraph } from '@/components/portfolio';
import { NewsRow } from '@/components/search/NewsRow';
import { SearchBar } from '@/components/search/SearchBar';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
  const colors = usePortfolioColors();
  const [query, setQuery] = useState('');

  // TEMP: mock “selected stock” + stats until backend is ready
  const selected = useMemo(() => {
    if (!query.trim()) return null;
    return {
      symbol: query.trim().toUpperCase(),
      today: '+$3.43 today',
      overall: 'Overall Change: -5%',
    };
  }, [query]);

  return (
    <TabScreenLayout pageTitle="Search">
      <ScrollView contentContainerStyle={styles.scroll}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Stock X" />

        {/* Stock Graph Card */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>1 Year Stock Graph</Text>

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
            <PortfolioGraph />
          </View>

          {selected && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[Typography.bodyMedium, { color: colors.primaryGreen }]}>{selected.today}</Text>
              <Text style={[Typography.small, { color: colors.errorRed }]}>{selected.overall}</Text>
            </View>
          )}
        </View>

        {/* News List */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>News</Text>

          <NewsRow
            title="The Economist"
            ageLabel="1d"
            logo={require('@/assets/images/icon.png')}
            onPress={() => {}}
          />
          <NewsRow
            title="Wall Street Journal"
            ageLabel="1d"
            logo={require('@/assets/images/icon.png')}
            onPress={() => {}}
          />
          <NewsRow
            title="Bloomberg"
            ageLabel="2d"
            logo={require('@/assets/images/icon.png')}
            onPress={() => {}}
          />
          <NewsRow
            title="Financial Times"
            ageLabel="3d"
            logo={require('@/assets/images/icon.png')}
            onPress={() => {}}
          />
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