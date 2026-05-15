import { ChartData } from './mockChartData';

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
  totalGainLoss: number;
  totalGainLossPct: number;
  mostProfitable: { symbol: string; gain: number };
  leastProfitable: { symbol: string; gain: number };
}

function displaySymbol(symbol: string): string {
  return symbol.includes(':') ? symbol.split(':').pop()?.trim() ?? symbol : symbol;
}

export function computePortfolioAnalytics(holdings: PortfolioHolding[]): PortfolioAnalyticsSummary {
  let startingAmount = 0;
  let currentAmount = 0;

  const stockStats = holdings.map((holding) => {
    const currentValue = holding.currentPrice * holding.shares;
    const startingValue = currentValue / (1 + holding.yearlyChangePct / 100);
    startingAmount += startingValue;
    currentAmount += currentValue;
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

function buildSeries(holdings: PortfolioHolding[], pointCount: number): number[] {
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
    0
  );

  return totals.map((value) => Math.round(value));
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

export function buildPortfolioChartDataByPeriod(holdings: PortfolioHolding[]): Record<string, ChartData> {
  const today = new Date();
  const ytdMonths = today.getMonth() + 1;

  return {
    '1D': chartEntry(getIntradayLabels(6), buildSeries(holdings, 6)),
    '1W': chartEntry(getDayLabels(7, 'weekday'), buildSeries(holdings, 7)),
    '1M': chartEntry(getDayLabels(30, 'date'), buildSeries(holdings, 30)),
    '3M': chartEntry(getMonthLabelsBack(3), buildSeries(holdings, 3)),
    '6M': chartEntry(getMonthLabelsBack(6), buildSeries(holdings, 6)),
    YTD: chartEntry(getMonthLabelsBack(ytdMonths), buildSeries(holdings, ytdMonths)),
    '1Y': chartEntry(getMonthLabelsBack(12), buildSeries(holdings, 12)),
    '2Y': chartEntry(getMonthLabelsBack(12), buildSeries(holdings, 12)),
  };
}

export function buildOneYearPortfolioChartData(holdings: PortfolioHolding[]): ChartData {
  const labels = getMonthLabels();
  const monthlyTotals = Array.from({ length: labels.length }, () => 0);

  holdings.forEach((holding, stockIndex) => {
    const currentValue = holding.currentPrice * holding.shares;
    const baseline = currentValue / (1 + holding.yearlyChangePct / 100);
    const volatility = Math.max(8, currentValue * 0.015);

    monthlyTotals.forEach((_, monthIndex) => {
      const progress = monthIndex / (labels.length - 1);
      const trendValue = baseline + (currentValue - baseline) * progress;
      const waveOffset =
        Math.sin((monthIndex + stockIndex * 1.7) * 0.9) * volatility * (1 - progress * 0.4);

      monthlyTotals[monthIndex] += clampMin(trendValue + waveOffset);
    });
  });

  monthlyTotals[monthlyTotals.length - 1] = holdings.reduce(
    (sum, holding) => sum + holding.currentPrice * holding.shares,
    0
  );

  return {
    labels,
    datasets: [
      {
        data: monthlyTotals.map((value) => Math.round(value)),
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };
}
