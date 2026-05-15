import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { PortfolioAnalyticsSummary } from '@/data/mockPortfolio';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PortfolioAnalyticsProps {
  analytics: PortfolioAnalyticsSummary;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatGain(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${formatCurrency(value)}`;
}

function AnalyticsRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const colors = usePortfolioColors();

  return (
    <View style={styles.row}>
      <Text style={[Typography.bodyMedium, styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[Typography.bodyMedium, styles.value, { color: valueColor ?? colors.textPrimary }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export function PortfolioAnalytics({ analytics }: PortfolioAnalyticsProps) {
  const colors = usePortfolioColors();
  const gainPositive = analytics.totalGainLoss >= 0;

  return (
    <View style={styles.container}>
      <Text style={[Typography.h2Small, styles.title, { color: colors.textPrimary }]}>
        Portfolio Analytics
      </Text>

      <AnalyticsRow label="Starting value" value={formatCurrency(analytics.startingAmount)} />
      <AnalyticsRow label="Current value" value={formatCurrency(analytics.currentAmount)} />
      <AnalyticsRow
        label="Total gain/loss"
        value={`${formatGain(analytics.totalGainLoss)} (${gainPositive ? '+' : ''}${analytics.totalGainLossPct.toFixed(1)}%)`}
        valueColor={gainPositive ? colors.primaryGreen : colors.errorRed}
      />
      <AnalyticsRow
        label="Most profitable"
        value={`${analytics.mostProfitable.symbol} ${formatGain(analytics.mostProfitable.gain)}`}
        valueColor={colors.primaryGreen}
      />
      <AnalyticsRow
        label="Least profitable"
        value={`${analytics.leastProfitable.symbol} ${formatGain(analytics.leastProfitable.gain)}`}
        valueColor={
          analytics.leastProfitable.gain >= 0 ? colors.primaryGreen : colors.errorRed
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  title: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  row: {
    gap: 2,
    alignItems: 'flex-end',
    width: '100%',
  },
  label: {
    textAlign: 'right',
  },
  value: {
    textAlign: 'right',
  },
});
