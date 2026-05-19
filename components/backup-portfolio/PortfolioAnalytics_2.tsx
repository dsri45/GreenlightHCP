import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { PortfolioAnalyticsSummary } from '@/data/mockPortfolio';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


const GL = {
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
  //const colors = usePortfolioColors();

  return (
    <View style={styles.row}>
      <Text style={[Typography.bodyMedium, styles.label, { color: GL.green900 }]}>{label}</Text>
      <Text
        style={[Typography.bodyMedium, styles.value, { color: valueColor ?? GL.green700 }]}
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
      <Text style={styles.chartTileLabel}>Portfolio Analytics</Text>

      <AnalyticsRow label="Starting value" value={formatCurrency(analytics.startingAmount)} />
      <AnalyticsRow label="Current value" value={formatCurrency(analytics.currentAmount)} />
      <AnalyticsRow
        label="Total gain/loss"
        value={`${formatGain(analytics.totalGainLoss)} (${gainPositive ? '+' : ''}${analytics.totalGainLossPct.toFixed(1)}%)`}
        valueColor={gainPositive ? GL.green700 : colors.errorRed}
      />
      <AnalyticsRow
        label="Most profitable"
        value={`${analytics.mostProfitable.symbol} ${formatGain(analytics.mostProfitable.gain)}`}
        valueColor={GL.green700}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: 8,
  },

  // ── Quick-stat strip ──────────────────────────────────────────────────────
  statStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },
  statTile: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  statTileDark: {
    backgroundColor: GL.green900,
  },
  statTileLight: {
    backgroundColor: GL.green100,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 6,
  },
  statSub: {
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Chart bento tile ──────────────────────────────────────────────────────
  chartTile: {
    backgroundColor: GL.green50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GL.green200,
    padding: 16,
    paddingBottom: 8,
  },
  chartTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green700,
    marginBottom: 10,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
    minHeight: 280,
    width: '100%',
  },
  graphColumn: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  analyticsColumn: {
    width: 158,
    flexShrink: 0,
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },

  // ── Section header ────────────────────────────────────────────────────────
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
    backgroundColor: GL.green500,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GL.green400,
  },

  // ── Stock list wrapper ────────────────────────────────────────────────────
  stockListWrapper: {
    width: '100%',
  },
});
