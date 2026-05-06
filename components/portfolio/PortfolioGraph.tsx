import { BorderRadius, Spacing } from '@/constants/theme';
import { ChartData, chartDataByPeriod } from '@/data/mockChartData';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line as SvgLine, Path } from 'react-native-svg';
import { TimePeriodButton } from './TimePeriodButton';

const TIME_PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '2Y'];

const CHART_WIDTH = 311;
const CHART_HEIGHT = 220;
const CHART_PADDING = 16;

/** Convert period chart data to line-plot points: { index, value }[] */
function toCartesianData(period: string, dataByPeriod: Record<string, ChartData>): { index: number; value: number }[] {
  const fallback = dataByPeriod['1M'] ?? Object.values(dataByPeriod)[0];
  const raw = dataByPeriod[period] ?? fallback;
  if (!raw) return [];
  const labels = raw.labels;
  const values = raw.datasets[0]?.data ?? [];
  return labels.map((_, i) => ({ index: i, value: values[i] ?? 0 }));
}

interface PortfolioGraphProps {
  initialPeriod?: string;
  periods?: string[];
  dataByPeriod?: Record<string, ChartData>;
}

export function PortfolioGraph({
  initialPeriod = '1M',
  periods = TIME_PERIODS,
  dataByPeriod = chartDataByPeriod,
}: PortfolioGraphProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const colors = usePortfolioColors();

  const fallbackPeriod = periods.includes(initialPeriod) ? initialPeriod : periods[0] ?? '1M';
  const activePeriod = periods.includes(selectedPeriod) ? selectedPeriod : fallbackPeriod;

  const data = useMemo(() => toCartesianData(activePeriod, dataByPeriod), [activePeriod, dataByPeriod]);
  const chartPoints = useMemo(() => {
    if (data.length < 2) {
      return '';
    }
    const values = data.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const graphWidth = CHART_WIDTH - CHART_PADDING * 2;
    const graphHeight = CHART_HEIGHT - CHART_PADDING * 2;

    return data
      .map((point, index) => {
        const x =
          CHART_PADDING + (index / Math.max(data.length - 1, 1)) * graphWidth;
        const y =
          CHART_PADDING + (1 - (point.value - minValue) / range) * graphHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.chartBackground, borderColor: colors.borderLight }]}>
      <View style={styles.timePeriodContainer}>
        {periods.map((period) => (
          <TimePeriodButton
            key={period}
            period={period}
            isSelected={activePeriod === period}
            onPress={() => setSelectedPeriod(period)}
          />
        ))}
      </View>

      <View
        style={[styles.chartContainer, { backgroundColor: colors.chartBackground }]}
      >
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <SvgLine
            x1={CHART_PADDING}
            y1={CHART_HEIGHT - CHART_PADDING}
            x2={CHART_WIDTH - CHART_PADDING}
            y2={CHART_HEIGHT - CHART_PADDING}
            stroke={colors.borderGridSolid}
            strokeWidth={StyleSheet.hairlineWidth}
          />
          <SvgLine
            x1={CHART_PADDING}
            y1={CHART_PADDING}
            x2={CHART_PADDING}
            y2={CHART_HEIGHT - CHART_PADDING}
            stroke={colors.borderGridSolid}
            strokeWidth={StyleSheet.hairlineWidth}
          />
          {chartPoints ? (
            <Path d={chartPoints} stroke={colors.primaryGreen} strokeWidth={2} fill="none" />
          ) : null}
        </Svg>
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
