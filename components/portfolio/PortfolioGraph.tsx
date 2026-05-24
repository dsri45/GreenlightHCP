import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { ChartData, chartDataByPeriod } from '@/data/mockChartData';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
const AXIS_PLOT_PADDING = 20;
const X_AXIS_LABEL_HEIGHT = 14;
const Y_TICK_COUNT = 5;
const X_TICK_MAX = 10;
const Y_LABEL_CHAR_WIDTH = 5.5;
const Y_LABEL_MIN_WIDTH = 22;
const Y_LABEL_EDGE_GAP = 2;

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
  return `$${value.toFixed(0)}`;
}

function computeYTicks(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return Array.from({ length: Y_TICK_COUNT }, (_, i) => {
    const ratio = i / (Y_TICK_COUNT - 1);
    return max - ratio * range;
  });
}

function measureYAxisWidth(ticks: number[]): number {
  if (ticks.length === 0) return Y_LABEL_MIN_WIDTH;
  const labels = ticks.map(formatDollarAxis);
  const longest = Math.max(...labels.map((label) => label.length));
  return Math.max(Y_LABEL_MIN_WIDTH, Math.ceil(longest * Y_LABEL_CHAR_WIDTH) + Y_LABEL_EDGE_GAP);
}

function pickTickIndices(length: number, maxTicks: number): number[] {
  if (length <= maxTicks) return Array.from({ length }, (_, i) => i);
  const indices: number[] = [];
  for (let i = 0; i < maxTicks; i += 1) {
    indices.push(Math.round((i / (maxTicks - 1)) * (length - 1)));
  }
  return Array.from(new Set(indices));
}

function getXTickCount(period: string, dataLength: number): number {
  if (period === '1Y' || period === '2Y' || dataLength >= 10) return 4;
  return Math.min(X_TICK_MAX, 6, dataLength);
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
  embedded?: boolean;
}

export function PortfolioGraph({
  initialPeriod = '1M',
  periods = TIME_PERIODS,
  dataByPeriod = chartDataByPeriod,
  showBorder = true,
  compact = false,
  showAxes = false,
  embedded = false,
}: PortfolioGraphProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [chartSize, setChartSize] = useState({
    width: compact ? CHART_WIDTH_COMPACT_FALLBACK : CHART_WIDTH_DEFAULT,
    height: compact ? CHART_HEIGHT_COMPACT_FALLBACK : CHART_HEIGHT_DEFAULT,
    //width: CHART_WIDTH_DEFAULT,
    //height: CHART_HEIGHT_DEFAULT,
  });
  const colors = usePortfolioColors();

  const fallbackPeriod = periods.includes(initialPeriod) ? initialPeriod : periods[0] ?? '1M';
  const activePeriod = periods.includes(selectedPeriod) ? selectedPeriod : fallbackPeriod;

  useEffect(() => {
    if (!periods.includes(selectedPeriod)) {
      setSelectedPeriod(fallbackPeriod);
    }
  }, [fallbackPeriod, periods, selectedPeriod]);

  const data = useMemo(() => toCartesianData(activePeriod, dataByPeriod), [activePeriod, dataByPeriod]);

  const yTicksForLayout = useMemo(
    () => computeYTicks(data.map((item) => item.value)),
    [data],
  );

  const yAxisWidth = showAxes ? measureYAxisWidth(yTicksForLayout) : 0;

  const plotPadLeft = showAxes ? AXIS_PLOT_PADDING : CHART_PADDING;
  const plotPadTop = showAxes ? AXIS_PLOT_PADDING : CHART_PADDING;
  const plotPadRight = showAxes ? AXIS_PLOT_PADDING : CHART_PADDING;
  const plotPadBottom = showAxes ? AXIS_PLOT_PADDING : CHART_PADDING;
  const xAxisReservedHeight = showAxes ? X_AXIS_LABEL_HEIGHT : 0;

  const handleChartRowLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width < 1) return;

      const chartAreaWidth = showAxes
        ? Math.max(1, Math.floor(width - yAxisWidth))
        : Math.floor(width);

      let totalHeight: number;
      if (height > 1) {
        totalHeight = Math.floor(height);
      } else {
        const plotHeight = Math.round(chartAreaWidth * 0.52);
        totalHeight =
          plotHeight + plotPadTop + plotPadBottom + xAxisReservedHeight;
      }

      setChartSize({ width: chartAreaWidth, height: totalHeight });
    },
    [showAxes, plotPadBottom, plotPadTop, xAxisReservedHeight, yAxisWidth],
  );

  const chartWidth = chartSize.width;
  const chartHeight = chartSize.height;
  const plotWidth = chartWidth - plotPadLeft - plotPadRight;
  const plotHeight = chartHeight - plotPadTop - plotPadBottom - xAxisReservedHeight;

  const { minValue, maxValue, yTicks, xTicks, chartPath } = useMemo(() => {
    if (data.length < 2 || plotWidth <= 0 || plotHeight <= 0) {
      return { minValue: 0, maxValue: 0, yTicks: [], xTicks: [], chartPath: '' };
    }

    const values = data.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const ticks = computeYTicks(values);

    const xIndices = pickTickIndices(data.length, getXTickCount(activePeriod, data.length));
    const xTickLabels = xIndices.map((index) => ({
      index,
      label: shortenXLabel(data[index]?.label ?? '', activePeriod),
    }));

    const path = data
      .map((point, index) => {
        const x = plotPadLeft + (index / Math.max(data.length - 1, 1)) * plotWidth;
        const y = plotPadTop + (1 - (point.value - min) / range) * plotHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return { minValue: min, maxValue: max, yTicks: ticks, xTicks: xTickLabels, chartPath: path };
  }, [activePeriod, data, plotHeight, plotPadLeft, plotPadTop, plotWidth]);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        embedded && styles.containerEmbedded,
        { backgroundColor: colors.chartBackground },
        showBorder && { borderColor: colors.borderLight, borderWidth: 1 },
      ]}
    >
      {periods.length > 1 && (
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
      )}

      <View
        style={[
          styles.chartRow,
          compact && styles.chartRowCompact,
          embedded && styles.chartRowEmbedded,
          showAxes && styles.chartRowWithAxes,
        ]}
        onLayout={compact || embedded ? handleChartRowLayout : undefined}
      >
        {showAxes && (
          <View style={[styles.yAxis, { width: yAxisWidth, height: chartHeight }]}>
            {yTicks.map((tick) => {
              const range = maxValue - minValue || 1;
              const top = plotPadTop + ((maxValue - tick) / range) * plotHeight - 5;
              return (
                <Text
                  key={tick}
                  style={[
                    Typography.small,
                    styles.yAxisLabel,
                    { color: colors.textTertiary, top, width: yAxisWidth },
                  ]}
                >
                  {formatDollarAxis(tick)}
                </Text>
              );
            })}
          </View>
        )}

        <View style={[styles.chartArea, showAxes && styles.chartAreaWithAxes]}>
          <View
            style={[
              styles.chartContainer,
              compact || embedded ? styles.chartContainerCompact : styles.chartContainerDefault,
              { backgroundColor: colors.chartBackground, width: chartWidth, height: chartHeight },
            ]}
          >
            <Svg width={chartWidth} height={chartHeight}>
              <SvgLine
                x1={plotPadLeft}
                y1={plotPadTop + plotHeight}
                x2={plotPadLeft + plotWidth}
                y2={plotPadTop + plotHeight}
                stroke={colors.borderGridSolid}
                strokeWidth={StyleSheet.hairlineWidth}
              />
              <SvgLine
                x1={plotPadLeft}
                y1={plotPadTop}
                x2={plotPadLeft}
                y2={plotPadTop + plotHeight}
                stroke={colors.borderGridSolid}
                strokeWidth={StyleSheet.hairlineWidth}
              />
              {chartPath ? (
                <Path d={chartPath} stroke={colors.primaryGreen} strokeWidth={2} fill="none" />
              ) : null}
            </Svg>

            {showAxes &&
              xTicks.map(({ index, label }) => {
                const xPos = plotPadLeft + (index / Math.max(data.length - 1, 1)) * plotWidth;
                const slotWidth = plotWidth / Math.max(xTicks.length - 1, 1);
                const labelWidth = Math.min(44, slotWidth * 0.92);
                const rawLeft = xPos - labelWidth / 2;
                const left = Math.max(0, Math.min(rawLeft, chartWidth - labelWidth));
                return (
                  <Text
                    key={`${index}-${label}`}
                    style={[
                      Typography.small,
                      styles.xAxisLabel,
                      {
                        color: colors.textTertiary,
                        left,
                        top: plotPadTop + plotHeight + 1,
                        width: labelWidth,
                      },
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
    borderRadius: BorderRadius.sm,
    paddingTop: 10,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCompact: {
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 0,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
  },
  containerEmbedded: {
    width: '100%',
    flex: 1,
    minHeight: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    alignItems: 'stretch',
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
    minHeight: 0,
  },
  chartRowEmbedded: {
    flex: 1,
    minHeight: 0,
  },
  chartRowWithAxes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chartArea: {
    flex: 1,
    minWidth: 0,
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
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  yAxis: {
    flexShrink: 0,
    position: 'relative',
    paddingLeft: 0,
    marginLeft: 0,
  },
  yAxisLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 9,
    lineHeight: 10,
    textAlign: 'right',
    paddingRight: 0,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    lineHeight: 10,
    textAlign: 'center',
  },
});
