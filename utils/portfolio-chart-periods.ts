export const PORTFOLIO_CHART_PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '2Y'] as const;

export type PortfolioChartPeriod = (typeof PORTFOLIO_CHART_PERIODS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getPeriodDurationMs(period: string, now = new Date()): number {
  switch (period) {
    case '1D':
      return 0;
    case '1W':
      return 7 * MS_PER_DAY;
    case '1M':
      return 30 * MS_PER_DAY;
    case '3M':
      return 90 * MS_PER_DAY;
    case '6M':
      return 180 * MS_PER_DAY;
    case 'YTD': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return now.getTime() - startOfYear.getTime();
    }
    case '1Y':
      return 365 * MS_PER_DAY;
    case '2Y':
      return 730 * MS_PER_DAY;
    default:
      return MS_PER_DAY;
  }
}

/** Period is available only if the account existed for at least that long. */
export function getAvailableChartPeriods(
  accountCreatedAt: Date | null,
  allPeriods: readonly string[] = PORTFOLIO_CHART_PERIODS,
  now = new Date(),
): string[] {
  if (!accountCreatedAt) {
    return ['1D'];
  }

  const accountAgeMs = now.getTime() - accountCreatedAt.getTime();
  return allPeriods.filter((period) => accountAgeMs >= getPeriodDurationMs(period, now));
}

export function getDefaultChartPeriod(availablePeriods: string[]): string {
  if (availablePeriods.length === 0) return '1D';
  return availablePeriods[availablePeriods.length - 1] ?? '1D';
}

export function getChartWindowStart(
  period: string,
  accountCreatedAt: Date,
  now = new Date(),
): Date {
  if (period === '1D') {
    const oneDayAgo = new Date(now.getTime() - MS_PER_DAY);
    return oneDayAgo.getTime() < accountCreatedAt.getTime() ? accountCreatedAt : oneDayAgo;
  }

  const periodStart = new Date(now.getTime() - getPeriodDurationMs(period, now));
  return periodStart.getTime() < accountCreatedAt.getTime() ? accountCreatedAt : periodStart;
}
