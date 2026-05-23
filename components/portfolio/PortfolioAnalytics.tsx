import { Spacing } from '@/constants/theme';
import { PortfolioAnalyticsSummary } from '@/data/mockPortfolio';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor ?? GL.green600 }]} numberOfLines={2}>
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

      {/* Section pip + label */}
      <View style={styles.header}>
        <View style={styles.headerPip} />
        <Text style={styles.headerLabel}>Analytics</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      <View style={styles.metricsPair}>
        <AnalyticsRow
          label="Start"
          value={formatCurrency(analytics.startingAmount)}
        />
        <AnalyticsRow
          label="Current"
          value={formatCurrency(analytics.currentAmount)}
        />
      </View>

      <View style={styles.divider} />

      <AnalyticsRow
        label="Gain/loss"
        value={`${formatGain(analytics.totalGainLoss)} (${gainPositive ? '+' : ''}${analytics.totalGainLossPct.toFixed(1)}%)`}
        valueColor={gainPositive ? GL.green600 : colors.errorRed}
      />

      <View style={styles.divider} />

      <View style={styles.metricsPair}>
        <AnalyticsRow
          label="Best"
          value={`${analytics.mostProfitable.symbol} ${formatGain(analytics.mostProfitable.gain)}`}
          valueColor={GL.green600}
        />
        <AnalyticsRow
          label="Worst"
          value={`${analytics.leastProfitable.symbol} ${formatGain(analytics.leastProfitable.gain)}`}
          valueColor={analytics.leastProfitable.gain >= 0 ? GL.green600 : colors.errorRed}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: GL.green900,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: Spacing.sm,
    alignItems: 'stretch',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    width: '100%',
    marginBottom: 2,
  },
  headerPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GL.green500,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green400,
  },

  // Divider
  divider: {
    width: '100%',
    height: 1.5,
    backgroundColor: GL.green800,
    marginVertical: 8,
  },

  // Row
  metricsPair: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: GL.dimGreen,
    flexShrink: 0,
  },
  rowValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 16,
  },
});