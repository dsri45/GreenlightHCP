import { BorderRadius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { usePortfolioColors } from '@/hooks/use-portfolio-colors';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { TimePeriodButton } from './TimePeriodButton';
import { chartDataByPeriod } from '@/data/mockChartData';

const TIME_PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '2Y'];

export function PortfolioGraph() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const colors = usePortfolioColors();

  const chartData = useMemo(() => {
    return chartDataByPeriod[selectedPeriod] || chartDataByPeriod['1M'];
  }, [selectedPeriod]);

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primaryGreen,
    labelColor: (opacity = 1) => colors.textTertiary,
    style: {
      borderRadius: BorderRadius.sm,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primaryGreen,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.borderGrid,
      strokeWidth: 1,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
      {/* Time Period Selector */}
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

      {/* Chart Area */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={311}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={false}
          segments={4}
          fromZero={false}
        />
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
    padding: Spacing.md,
  },
  timePeriodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});

