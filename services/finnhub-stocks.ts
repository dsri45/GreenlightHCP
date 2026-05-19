const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  percentChange: number;
  previousClose: number;
}

function sanitizeSymbol(symbol: string): string {
  // Handles 'NYSE: BA' -> 'BA' (same pattern as use-portfolio-news.ts)
  return symbol.includes(':') ? symbol.split(':').pop()?.trim() ?? symbol : symbol.trim();
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  const apiKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY?.trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey) {
    console.warn('EXPO_PUBLIC_FINNHUB_API_KEY not set — using mock prices');
    return null;
  }

  const cleanSymbol = sanitizeSymbol(symbol);

  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub request failed (${response.status})`);
    }

    const data = await response.json();

    // Finnhub returns all zeros for invalid/unknown symbols
    if (data.c === 0 && data.pc === 0) {
      console.warn(`No data found for symbol: ${cleanSymbol}`);
      return null;
    }

    return {
      symbol, // preserve original format (e.g. 'NYSE: BA')
      currentPrice: data.c,
      percentChange: data.dp,
      previousClose: data.pc,
    };
  } catch (err) {
    console.warn(`Failed to fetch quote for ${symbol}:`, err);
    return null;
  }
}

export async function fetchStockQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = await Promise.all(symbols.map(fetchStockQuote));
  const quoteMap = new Map<string, StockQuote>();

  results.forEach((quote) => {
    if (quote) quoteMap.set(quote.symbol, quote);
  });

  return quoteMap;
}