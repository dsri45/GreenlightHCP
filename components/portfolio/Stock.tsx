import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

export interface StockProps {
  symbol: string;
  shares: number;
  pricePerShare: string;
  logo: ImageSourcePropType;
  isPositive?: boolean;
}

export function Stock({ symbol, shares, pricePerShare, logo, isPositive = true }: StockProps) {
  const colors = usePortfolioColors();

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[Typography.bodyMedium, { color: isPositive ? colors.primaryGreen : colors.errorRed }]}>
            {symbol} {shares} shares
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>{pricePerShare}/share</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <View style={[styles.coloredRectangle, { backgroundColor: colors.stockCardBackground }]} />
        <View style={styles.iconContainer}>
          <View style={[styles.icon, { backgroundColor: colors.black }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 360,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  textContainer: {
    gap: Spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginLeft: Spacing.lg,
  },
  coloredRectangle: {
    width: 125,
    height: 55,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 27,
    height: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 27,
    height: 27,
    opacity: 0.1,
    borderRadius: BorderRadius.sm,
  },
});

