/** Public ticker logo images (no API key required). */
export function getStockLogoUri(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(normalized)}.png`;
}
