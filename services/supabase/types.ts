export type InvestingType = 'investing' | 'watchlist';

export interface DbStock {
  stock_id: string;
  abbreviation: string;
}

export interface DbUserToStock {
  user_to_stock_id: string;
  user_id: string;
  stock_id: string;
  investing: InvestingType;
  shares: number;
}

export interface DbUserToStockWithStock extends DbUserToStock {
  stocks: DbStock | null;
}
