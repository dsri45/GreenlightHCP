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
