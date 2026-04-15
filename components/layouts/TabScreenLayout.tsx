import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TabScreenLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

/**
 * Shared layout component for all tab screens.
 * Includes the Greenlight brand header and optional page title.
 */
export function TabScreenLayout({ children, pageTitle }: TabScreenLayoutProps) {
  const colors = usePortfolioColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={[Typography.brand, styles.brandText, { color: colors.greenlightBrand }]}>Greenlight</Text>
        </View>
        {pageTitle && (
          <View style={styles.pageTitleContainer}>
            <Text style={[Typography.pageTitle, { color: colors.textPrimary }]}>{pageTitle}</Text>
          </View>
        )}
      </View>

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  brandContainer: {
    width: 191,
    height: 51,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandText: {
    textAlign: 'center',
  },
  pageTitleContainer: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
});

