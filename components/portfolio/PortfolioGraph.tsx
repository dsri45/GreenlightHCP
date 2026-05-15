import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { ChartData, chartDataByPeriod } from '@/data/mockChartData';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Line as SvgLine } from 'react-native-svg';
import { TimePeriodButton } from './TimePeriodButton';

const TIME_PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '2Y'];
const DAY_BASED_PERIODS = new Set(['1D', '1W', '1M']);

const CHART_WIDTH_DEFAULT = 311;
const CHART_HEIGHT_DEFAULT = 220;
const CHART_WIDTH_COMPACT_FALLBACK = 168;
const CHART_HEIGHT_COMPACT_FALLBACK = 200;
const CHART_PADDING = 8;
const Y_AXIS_GUTTER = 60;
const X_AXIS_HEIGHT = 30;
const Y_TICK_COUNT = 5;
const X_TICK_MAX = 10;

function toCartesianData(
  period: string,
  dataByPeriod: Record<string, ChartData>
): { index: number; value: number; label: string }[] {
  const fallback = dataByPeriod['1M'] ?? Object.values(dataByPeriod)[0];
  const raw = dataByPeriod[period] ?? fallback;
  if (!raw) return [];
  const labels = raw.labels;
  const values = raw.datasets[0]?.data ?? [];
  return labels.map((label, i) => ({ index: i, value: values[i] ?? 0, label }));
}

function formatDollarAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${(value).toFixed(1)}`;
}

function pickTickIndices(length: number, maxTicks: number): number[] {
  if (length <= maxTicks) return Array.from({ length }, (_, i) => i);
  const indices: number[] = [];
  for (let i = 0; i < maxTicks; i += 1) {
    indices.push(Math.round((i / (maxTicks - 1)) * (length - 1)));
  }
  return Array.from(new Set(indices));
}

function shortenXLabel(label: string, period: string): string {
  if (DAY_BASED_PERIODS.has(period) && period === '1M') {
    const parts = label.split(' ');
    return parts.length > 1 ? parts[1] ?? label : label;
  }
  return label;
}

interface PortfolioGraphProps {
  initialPeriod?: string;
  periods?: string[];
  dataByPeriod?: Record<string, ChartData>;
  showBorder?: boolean;
  compact?: boolean;
  showAxes?: boolean;
}

export function PortfolioGraph({
  initialPeriod = '1M',
  periods = TIME_PERIODS,
  dataByPeriod = chartDataByPeriod,
  showBorder = true,
  compact = false,
  showAxes = false,
}: PortfolioGraphProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [chartSize, setChartSize] = useState({
    width: compact ? CHART_WIDTH_COMPACT_FALLBACK : CHART_WIDTH_DEFAULT,
    height: compact ? CHART_HEIGHT_COMPACT_FALLBACK : CHART_HEIGHT_DEFAULT,
    //width: CHART_WIDTH_DEFAULT,
    //height: CHART_HEIGHT_DEFAULT,
  });
  const colors = usePortfolioColors();

  const handleChartLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width < 1 || height < 1) return;
      setChartSize({ width: Math.floor(width), height: Math.floor(height) });
    },
    []
  );

  const chartWidth = chartSize.width;
  const chartHeight = chartSize.height;
  const plotWidth = chartWidth - CHART_PADDING * 2;
  const plotHeight = chartHeight - CHART_PADDING * 2 - (showAxes ? X_AXIS_HEIGHT : 0);

  const fallbackPeriod = periods.includes(initialPeriod) ? initialPeriod : periods[0] ?? '1M';
  const activePeriod = periods.includes(selectedPeriod) ? selectedPeriod : fallbackPeriod;

  const data = useMemo(() => toCartesianData(activePeriod, dataByPeriod), [activePeriod, dataByPeriod]);

  const { minValue, maxValue, yTicks, xTicks, chartPath } = useMemo(() => {
    if (data.length < 2 || plotWidth <= 0 || plotHeight <= 0) {
      return { minValue: 0, maxValue: 0, yTicks: [], xTicks: [], chartPath: '' };
    }

    const values = data.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const ticks = Array.from({ length: Y_TICK_COUNT }, (_, i) => {
      const ratio = i / (Y_TICK_COUNT - 1);
      return max - ratio * range;
    });

    const xIndices = pickTickIndices(data.length, X_TICK_MAX);
    const xTickLabels = xIndices.map((index) => ({
      index,
      label: shortenXLabel(data[index]?.label ?? '', activePeriod),
    }));

    const path = data
      .map((point, index) => {
        const x = CHART_PADDING + (index / Math.max(data.length - 1, 1)) * plotWidth;
        const y = CHART_PADDING + (1 - (point.value - min) / range) * plotHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return { minValue: min, maxValue: max, yTicks: ticks, xTicks: xTickLabels, chartPath: path };
  }, [activePeriod, data, plotHeight, plotWidth]);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: colors.chartBackground },
        showBorder && { borderColor: colors.borderLight, borderWidth: 1 },
      ]}
    >
      <View style={[styles.timePeriodContainer, compact && styles.timePeriodContainerCompact]}>
        {periods.map((period) => (
          <TimePeriodButton
            key={period}
            period={period}
            isSelected={activePeriod === period}
            onPress={() => setSelectedPeriod(period)}
          />
        ))}
      </View>

      <View style={[styles.chartRow, compact && styles.chartRowCompact, showAxes && styles.chartRowWithAxes]}>
        {showAxes && (
          <View style={[styles.yAxis, { width: Y_AXIS_GUTTER, height: chartHeight }]}>
            {yTicks.map((tick) => {
              const range = maxValue - minValue || 1;
              const top = CHART_PADDING + ((maxValue - tick) / range) * plotHeight - 6;
              return (
                <Text
                  key={tick}
                  style={[Typography.small, styles.yAxisLabel, { color: colors.textTertiary, top }]}
                >
                  {formatDollarAxis(tick)}
                </Text>
              );
            })}
          </View>
        )}

        <View
          style={[styles.chartArea, showAxes && styles.chartAreaWithAxes]}
          onLayout={compact ? handleChartLayout : undefined}
        >
          <View
            style={[
              styles.chartContainer,
              compact ? styles.chartContainerCompact : styles.chartContainerDefault,
              { backgroundColor: colors.chartBackground },
              !compact && { width: CHART_WIDTH_DEFAULT, height: CHART_HEIGHT_DEFAULT },
            ]}
          >
            <Svg width={chartWidth} height={chartHeight}>
              <SvgLine
                x1={CHART_PADDING}
                y1={CHART_PADDING + plotHeight}
                x2={CHART_PADDING + plotWidth}
                y2={CHART_PADDING + plotHeight}
                stroke={colors.borderGridSolid}
                strokeWidth={StyleSheet.hairlineWidth}
              />
              <SvgLine
                x1={CHART_PADDING}
                y1={CHART_PADDING}
                x2={CHART_PADDING}
                y2={CHART_PADDING + plotHeight}
                stroke={colors.borderGridSolid}
                strokeWidth={StyleSheet.hairlineWidth}
              />
              {chartPath ? (
                <Path d={chartPath} stroke={colors.primaryGreen} strokeWidth={2} fill="none" />
              ) : null}
            </Svg>

            {showAxes &&
              xTicks.map(({ index, label }) => {
                const left =
                  CHART_PADDING + (index / Math.max(data.length - 1, 1)) * plotWidth - 14;
                return (
                  <Text
                    key={`${index}-${label}`}
                    style={[
                      Typography.small,
                      styles.xAxisLabel,
                      { color: colors.textTertiary, left, top: CHART_PADDING + plotHeight + 4 },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                );
              })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 343,
    minHeight: 282,
    borderRadius: BorderRadius.sm,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCompact: {
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    paddingLeft: 0,
    paddingRight: Spacing.xs,
    paddingBottom: Spacing.xs,
    minHeight: 260,
  },
  timePeriodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    width: '100%',
  },
  timePeriodContainerCompact: {
    justifyContent: 'flex-start',
    marginBottom: Spacing.xs,
  },
  chartRow: {
    width: '100%',
  },
  chartRowCompact: {
    flex: 1,
    minHeight: CHART_HEIGHT_COMPACT_FALLBACK,
  },
  chartRowWithAxes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chartArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  chartAreaWithAxes: {
    flex: 1,
    minWidth: 0,
  },
  chartContainer: {
    borderRadius: BorderRadius.sm,
    position: 'relative',
  },
  chartContainerDefault: {
    overflow: 'visible',
    alignSelf: 'center',
  },
  chartContainerCompact: {
    flex: 1,
    width: '100%',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  yAxis: {
    flexShrink: 0,
    position: 'relative',
  },
  yAxisLabel: {
    position: 'absolute',
    right: 2,
    fontSize: 9,
    width: Y_AXIS_GUTTER - 6,
    textAlign: 'right',
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    width: 32,
    textAlign: 'center',
  },
});
