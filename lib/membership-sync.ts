type RefreshFn = () => Promise<void>;

let refreshPortfolio: RefreshFn | null = null;
let refreshWatchlist: RefreshFn | null = null;

export function setPortfolioRefresh(fn: RefreshFn | null): void {
  refreshPortfolio = fn;
}

export function setWatchlistRefresh(fn: RefreshFn | null): void {
  refreshWatchlist = fn;
}

export async function notifyPortfolioRefresh(): Promise<void> {
  await refreshPortfolio?.();
}

export async function notifyWatchlistRefresh(): Promise<void> {
  await refreshWatchlist?.();
}
