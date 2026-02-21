import { BorderRadius, Spacing } from '@/constants/theme';
import { chartDataByPeriod } from '@/data/mockChartData';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import { useFont } from '@shopify/react-native-skia';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { TimePeriodButton } from './TimePeriodButton';
import { Inter_600SemiBold } from '@expo-google-fonts/inter';

const TIME_PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '2Y'];

const CHART_WIDTH = 311;
const CHART_HEIGHT = 220;

/** Convert period chart data to victory-native shape: { index, value }[] */
function toCartesianData(period: string): { index: number; value: number }[] {
  const raw = chartDataByPeriod[period] ?? chartDataByPeriod['1M'];
  const labels = raw.labels;
  const values = raw.datasets[0]?.data ?? [];
  return labels.map((_, i) => ({ index: i, value: values[i] ?? 0 }));
}

export function PortfolioGraph() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [layoutReady, setLayoutReady] = useState(false);
  const colors = usePortfolioColors();

  const rawChartData = chartDataByPeriod[selectedPeriod] ?? chartDataByPeriod['1M'];
  const data = useMemo(() => toCartesianData(selectedPeriod), [selectedPeriod]);
  const labels = rawChartData.labels;

  const font = useFont(Inter_600SemiBold, 12);

  const formatYLabel = (value: number | string) => {
    const n = Number(value);
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(value);
  };

  const formatXLabelShort = (index: number | string) => {
    const i = typeof index === 'number' ? index : parseInt(String(index), 10);
    const label = labels[i];
    if (!label || label.length <= 2) return label ?? String(i);
    const monthMatch = label.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d*)/i);
    if (monthMatch) return `${monthMatch[1][0]}${monthMatch[2] || ''}`.slice(0, 3);
    if (/^\d{4}$/.test(label)) return label.slice(2);
    return label.length > 3 ? label.slice(0, 3) : label;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.chartBackground, borderColor: colors.borderLight }]}>
      <View style={styles.timePeriodContainer}>
        {TIME_PERIODS.map((period) => (
          <TimePeriodButton
            key={period}
            period={period}
            isSelected={selectedPeriod === period}
            onPress={() => setSelectedPeriod(period)}
          />
        ))}
      </View>

      <View
        style={[styles.chartContainer, { backgroundColor: colors.chartBackground }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0 && !layoutReady) setLayoutReady(true);
        }}
      >
        {layoutReady && (
          <CartesianChart
            data={data}
            xKey="index"
            yKeys={['value']}
            padding={{ left: 8, right: 8, top: 8, bottom: 8 }}
            axisOptions={{
              font,
              tickCount: { x: Math.min(data.length, 8), y: 4 },
              lineColor: colors.borderGridSolid,
              lineWidth: StyleSheet.hairlineWidth,
              labelColor: colors.textPrimary,
              formatXLabel: (v) => formatXLabelShort(v as number),
              formatYLabel: (v) => formatYLabel(v),
            }}
            frame={{
              lineColor: colors.borderGridSolid,
              lineWidth: StyleSheet.hairlineWidth,
            }}
          >
            {({ points }) => (
              <Line
                points={points.value}
                color={colors.primaryGreen}
                strokeWidth={2}
                curveType="linear"
              />
            )}
          </CartesianChart>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 343,
    minHeight: 282,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingTop: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: 0,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePeriodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  chartContainer: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    borderRadius: BorderRadius.sm,
    marginLeft: 0,
    marginBottom: 0,
    overflow: 'visible',
  },
});
