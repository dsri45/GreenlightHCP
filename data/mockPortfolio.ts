import { ChartData } from './mockChartData';
import {
  getAvailableChartPeriods,
  getChartWindowStart,
  PORTFOLIO_CHART_PERIODS,
} from '@/utils/portfolio-chart-periods';

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  currentPrice: number;
  yearlyChangePct: number;
}

export const mockPortfolioHoldings: PortfolioHolding[] = [
  { symbol: 'MSFT', shares: 3, currentPrice: 425, yearlyChangePct: 17.8 },
  { symbol: 'NYSE: BA', shares: 3, currentPrice: 184, yearlyChangePct: -6.4 },
  { symbol: 'NVDA', shares: 3, currentPrice: 946, yearlyChangePct: 71.2 },
  { symbol: 'AAPL', shares: 3, currentPrice: 198, yearlyChangePct: 12.1 },
];

function getMonthLabels(): string[] {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const today = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
    return formatter.format(d);
  });
}

function clampMin(value: number): number {
  return Math.max(1, value);
}

export function buildOneYearStockChartData(stock: {
  currentPrice: number;
  yearlyChangePct: number;
}): ChartData {
  const labels = getMonthLabels();
  const currentValue = stock.currentPrice;
  const baseline = currentValue / (1 + stock.yearlyChangePct / 100);
  const volatility = Math.max(4, currentValue * 0.02);

  const data = labels.map((_, monthIndex) => {
    const progress = monthIndex / (labels.length - 1);
    const trendValue = baseline + (currentValue - baseline) * progress;
    const waveOffset = Math.sin(monthIndex * 0.85) * volatility * (1 - progress * 0.35);
    return Math.round(clampMin(trendValue + waveOffset));
  });

  data[data.length - 1] = Math.round(currentValue);

  return {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };
}

export interface PortfolioAnalyticsSummary {
  startingAmount: number;
  currentAmount: number;
  cashAvailable: number;
  investedValue: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  mostProfitable: { symbol: string; gain: number };
  leastProfitable: { symbol: string; gain: number };
}

function displaySymbol(symbol: string): string {
  return symbol.includes(':') ? symbol.split(':').pop()?.trim() ?? symbol : symbol;
}

export function computePortfolioAnalytics(
  holdings: PortfolioHolding[],
  cash: number,
  initialBalance = 5000,
): PortfolioAnalyticsSummary {
  const investedValue = holdings.reduce(
    (sum, holding) => sum + holding.currentPrice * holding.shares,
    0,
  );
  const currentAmount = cash + investedValue;
  const startingAmount = initialBalance;

  const stockStats = holdings.map((holding) => {
    const currentValue = holding.currentPrice * holding.shares;
    const startingValue = currentValue / (1 + holding.yearlyChangePct / 100);
    return {
      symbol: displaySymbol(holding.symbol),
      gain: currentValue - startingValue,
    };
  });

  const sorted = [...stockStats].sort((a, b) => b.gain - a.gain);
  const most = sorted[0] ?? { symbol: '—', gain: 0 };
  const least = sorted[sorted.length - 1] ?? { symbol: '—', gain: 0 };
  const totalGainLoss = currentAmount - startingAmount;

  return {
    startingAmount: Math.round(startingAmount),
    currentAmount: Math.round(currentAmount),
    cashAvailable: Math.round(cash),
    investedValue: Math.round(investedValue),
    totalGainLoss: Math.round(totalGainLoss),
    totalGainLossPct: startingAmount > 0 ? (totalGainLoss / startingAmount) * 100 : 0,
    mostProfitable: most,
    leastProfitable: least,
  };
}

function getDayLabels(count: number, format: 'weekday' | 'date'): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - index));
    if (format === 'weekday') {
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  });
}

function getMonthLabelsBack(count: number): string[] {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return formatter.format(d);
  });
}

function getIntradayLabels(count: number): string[] {
  const hours = [9, 11, 13, 15, 17, 19];
  return hours.slice(0, count).map((hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour;
    return `${display}${suffix}`;
  });
}

function buildInvestedSeries(holdings: PortfolioHolding[], pointCount: number): number[] {
  if (holdings.length === 0) {
    return Array.from({ length: pointCount }, () => 0);
  }

  const totals = Array.from({ length: pointCount }, () => 0);

  holdings.forEach((holding, stockIndex) => {
    const currentValue = holding.currentPrice * holding.shares;
    const baseline = currentValue / (1 + holding.yearlyChangePct / 100);
    const volatility = Math.max(8, currentValue * 0.015);

    totals.forEach((_, pointIndex) => {
      const progress = pointIndex / Math.max(pointCount - 1, 1);
      const trendValue = baseline + (currentValue - baseline) * progress;
      const waveOffset =
        Math.sin((pointIndex + stockIndex * 1.7) * 0.9) * volatility * (1 - progress * 0.4);
      totals[pointIndex] += clampMin(trendValue + waveOffset);
    });
  });

  totals[totals.length - 1] = holdings.reduce(
    (sum, holding) => sum + holding.currentPrice * holding.shares,
    0,
  );

  return totals;
}

function getLabelsForWindow(windowStart: Date, windowEnd: Date, pointCount: number): string[] {
  const spanMs = windowEnd.getTime() - windowStart.getTime();
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = pointCount <= 1 ? 1 : index / (pointCount - 1);
    const timestamp = windowStart.getTime() + spanMs * progress;
    const date = new Date(timestamp);

    if (index === pointCount - 1) return 'Now';
    if (spanMs < 2 * 24 * 60 * 60 * 1000) return timeFormatter.format(date);
    if (spanMs < 10 * 24 * 60 * 60 * 1000) return weekdayFormatter.format(date);
    if (spanMs < 120 * 24 * 60 * 60 * 1000) return dayFormatter.format(date);
    return monthFormatter.format(date);
  });
}

function getPointCountForWindow(windowStart: Date, windowEnd: Date, period: string): number {
  const spanMs = windowEnd.getTime() - windowStart.getTime();
  const spanDays = spanMs / (24 * 60 * 60 * 1000);

  if (period === '1D' || spanDays < 1.5) return Math.max(2, Math.min(6, Math.ceil(spanDays * 6) + 1));
  if (period === '1W' || spanDays < 10) return Math.max(2, Math.min(7, Math.ceil(spanDays) + 1));
  if (period === '1M' || spanDays < 45) return Math.max(2, Math.min(30, Math.ceil(spanDays)));
  if (period === '3M') return Math.max(2, Math.min(12, Math.ceil(spanDays / 7)));
  if (period === '6M' || period === 'YTD') return Math.max(2, Math.min(12, Math.ceil(spanDays / 30)));
  return Math.max(2, Math.min(12, Math.ceil(spanDays / 30)));
}

function buildSeries(
  holdings: PortfolioHolding[],
  pointCount: number,
  cash: number,
  initialBalance = 5000,
  useHoldingTrends = true,
): number[] {
  const currentTotal =
    cash + holdings.reduce((sum, holding) => sum + holding.currentPrice * holding.shares, 0);
  const lastIndex = Math.max(pointCount - 1, 1);

  if (!useHoldingTrends || holdings.length === 0) {
    return Array.from({ length: pointCount }, (_, index) => {
      const progress = index / lastIndex;
      return Math.round(initialBalance + (currentTotal - initialBalance) * progress);
    });
  }

  const investedSeries = buildInvestedSeries(holdings, pointCount);
  const startInvested = investedSeries[0];
  const endInvested = investedSeries[pointCount - 1];
  const investedRange = endInvested - startInvested;
  const totalRange = currentTotal - initialBalance;

  return investedSeries.map((investedValue, index) => {
    if (Math.abs(investedRange) < 0.01) {
      const progress = index / lastIndex;
      return Math.round(initialBalance + totalRange * progress);
    }

    const progress = (investedValue - startInvested) / investedRange;
    return Math.round(initialBalance + totalRange * progress);
  });
}

function chartEntry(labels: string[], data: number[]): ChartData {
  return {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };
}

function buildChartForPeriod(
  period: string,
  holdings: PortfolioHolding[],
  cash: number,
  initialBalance: number,
  accountCreatedAt: Date,
  now: Date,
): ChartData {
  const windowStart = getChartWindowStart(period, accountCreatedAt, now);
  const windowEnd = now;
  const accountCoversFullWindow = windowStart.getTime() <= accountCreatedAt.getTime() + 60_000;
  const pointCount = getPointCountForWindow(windowStart, windowEnd, period);
  const labels = getLabelsForWindow(windowStart, windowEnd, pointCount);
  const useHoldingTrends = !accountCoversFullWindow;

  const data = buildSeries(
    holdings,
    pointCount,
    cash,
    initialBalance,
    useHoldingTrends,
  );

  if (accountCoversFullWindow && data.length > 0) {
    data[0] = Math.round(initialBalance);
    data[data.length - 1] = Math.round(
      cash + holdings.reduce((sum, holding) => sum + holding.currentPrice * holding.shares, 0),
    );
  }

  return chartEntry(labels, data);
}

export function buildPortfolioChartDataByPeriod(
  holdings: PortfolioHolding[],
  cash: number,
  initialBalance = 5000,
  accountCreatedAt: Date | null = null,
): Record<string, ChartData> {
  const now = new Date();
  const createdAt = accountCreatedAt ?? now;
  const availablePeriods = getAvailableChartPeriods(createdAt, PORTFOLIO_CHART_PERIODS, now);

  const result: Record<string, ChartData> = {};
  for (const period of availablePeriods) {
    result[period] = buildChartForPeriod(
      period,
      holdings,
      cash,
      initialBalance,
      createdAt,
      now,
    );
  }
  return result;
}

export { getAvailableChartPeriods, getDefaultChartPeriod } from '@/utils/portfolio-chart-periods';

export function buildOneYearPortfolioChartData(
  holdings: PortfolioHolding[],
  cash: number,
  initialBalance = 5000,
  accountCreatedAt: Date | null = null,
): ChartData {
  const now = new Date();
  const createdAt = accountCreatedAt ?? now;

  if (getAvailableChartPeriods(createdAt, ['1Y'], now).length === 0) {
    return buildChartForPeriod('1D', holdings, cash, initialBalance, createdAt, now);
  }

  return buildChartForPeriod('1Y', holdings, cash, initialBalance, createdAt, now);
}
