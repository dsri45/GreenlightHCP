/**
 * Mock chart data for different time periods
 */

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

// Mock data for different time periods
export const chartDataByPeriod: Record<string, ChartData> = {
  '1D': {
    labels: ['9AM', '12PM', '3PM', '6PM', '9PM'],
    datasets: [
      {
        data: [30000, 32000, 35000, 38000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  '1W': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [30000, 31000, 33000, 35000, 37000, 38000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  '1M': {
    labels: ['Nov 23', '24', '25', '26', '27', '28', '29', '30'],
    datasets: [
      {
        data: [30000, 31000, 32000, 33000, 35000, 36000, 38000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  '3M': {
    labels: ['Sep', 'Oct', 'Nov'],
    datasets: [
      {
        data: [28000, 32000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  '6M': {
    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        data: [25000, 27000, 29000, 30000, 35000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  'YTD': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        data: [20000, 22000, 24000, 26000, 28000, 30000, 32000, 34000, 36000, 38000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  '1Y': {
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        data: [18000, 20000, 22000, 24000, 26000, 28000, 30000, 32000, 34000, 36000, 38000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
  '2Y': {
    labels: ['2022', '2023', '2024'],
    datasets: [
      {
        data: [15000, 25000, 40000],
        color: (opacity = 1) => `rgba(24, 131, 67, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  },
};

