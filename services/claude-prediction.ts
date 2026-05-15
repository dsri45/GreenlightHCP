import { PortfolioNewsArticle } from '@/hooks/use-portfolio-news';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export interface IndustryPick {
  symbol: string;
  name: string;
  rationale: string;
}

export interface StockPrediction {
  symbol: string;
  companyName: string;
  recommendation: 'buy' | 'hold' | 'avoid';
  summary: string;
  worthTracking: boolean | null;
  suggestedShares: number | null;
  reasoning: string;
  industryPicks: IndustryPick[];
}

export interface PredictionRequest {
  symbol: string;
  companyName: string;
  currentPrice: number;
  yearlyChangePct: number;
  articles: PortfolioNewsArticle[];
  isPortfolio: boolean;
}

const INDUSTRY_BY_SYMBOL: Record<string, string> = {
  AAPL: 'Technology',
  MSFT: 'Technology',
  NVDA: 'Semiconductors',
  GOOGL: 'Technology',
  META: 'Technology',
  AMZN: 'Consumer & E-commerce',
  TSLA: 'Automotive & Clean Energy',
  BA: 'Aerospace & Defense',
};

const INDUSTRY_ALTERNATIVES: Record<string, IndustryPick[]> = {
  Technology: [
    { symbol: 'DDOG', name: 'Datadog', rationale: 'Cloud monitoring with strong recurring revenue.' },
    { symbol: 'SNOW', name: 'Snowflake', rationale: 'Data platform growing with enterprise adoption.' },
    { symbol: 'NET', name: 'Cloudflare', rationale: 'Edge networking play with expanding margins.' },
  ],
  Semiconductors: [
    { symbol: 'ON', name: 'ON Semiconductor', rationale: 'Power and sensing chips for EV/industrial.' },
    { symbol: 'MPWR', name: 'Monolithic Power', rationale: 'High-efficiency power management leader.' },
    { symbol: 'SWKS', name: 'Skyworks Solutions', rationale: 'RF components tied to mobile and IoT.' },
  ],
  'Consumer & E-commerce': [
    { symbol: 'ETSY', name: 'Etsy', rationale: 'Niche marketplace with loyal creator base.' },
    { symbol: 'CHWY', name: 'Chewy', rationale: 'Subscription-heavy pet retail model.' },
    { symbol: 'W', name: 'Wayfair', rationale: 'Home goods e-commerce with operating leverage.' },
  ],
  'Automotive & Clean Energy': [
    { symbol: 'ENPH', name: 'Enphase Energy', rationale: 'Residential solar microinverter leader.' },
    { symbol: 'LCID', name: 'Lucid Group', rationale: 'Premium EV segment with technology focus.' },
    { symbol: 'PLUG', name: 'Plug Power', rationale: 'Hydrogen solutions for industrial mobility.' },
  ],
  'Aerospace & Defense': [
    { symbol: 'KTOS', name: 'Kratos Defense', rationale: 'Unmanned systems and defense tech exposure.' },
    { symbol: 'HEI', name: 'HEICO', rationale: 'Aftermarket aerospace components with steady growth.' },
    { symbol: 'AVAV', name: 'AeroVironment', rationale: 'Drones and tactical unmanned systems.' },
  ],
  Diversified: [
    { symbol: 'VIG', name: 'Vanguard Dividend Appreciation', rationale: 'Broad quality dividend ETF for easy entry.' },
    { symbol: 'SCHD', name: 'Schwab US Dividend Equity', rationale: 'Low-cost dividend exposure.' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', rationale: 'Simple diversified market exposure.' },
  ],
};

const POSITIVE_SIGNALS = ['beat', 'growth', 'partnership', 'expansion', 'investment', 'record', 'raise', 'profit'];
const NEGATIVE_SIGNALS = ['miss', 'lawsuit', 'decline', 'cut', 'bankruptcy', 'loss', 'warning', 'layoff'];

function getIndustryPicks(symbol: string): IndustryPick[] {
  const industry = INDUSTRY_BY_SYMBOL[symbol] ?? 'Diversified';
  return INDUSTRY_ALTERNATIVES[industry] ?? INDUSTRY_ALTERNATIVES.Diversified;
}

function scoreArticles(articles: PortfolioNewsArticle[]): number {
  if (articles.length === 0) return 0;

  return articles.reduce((score, article) => {
    const text = article.title.toLowerCase();
    const positive = POSITIVE_SIGNALS.some((word) => text.includes(word));
    const negative = NEGATIVE_SIGNALS.some((word) => text.includes(word));
    if (positive && !negative) return score + 1;
    if (negative && !positive) return score - 1;
    return score;
  }, 0);
}

function buildMockPrediction(request: PredictionRequest): StockPrediction {
  const articleScore = scoreArticles(request.articles);
  const momentumBoost = request.yearlyChangePct >= 10 ? 1 : request.yearlyChangePct <= -5 ? -1 : 0;
  const totalScore = articleScore + momentumBoost;

  let recommendation: StockPrediction['recommendation'];
  if (totalScore >= 2) recommendation = 'buy';
  else if (totalScore <= -1) recommendation = 'avoid';
  else recommendation = 'hold';

  const industryPicks = request.isPortfolio
    ? INDUSTRY_ALTERNATIVES.Diversified
    : getIndustryPicks(request.symbol);

  const articleContext =
    request.articles.length > 0
      ? `Based on ${request.articles.length} recent headline(s), sentiment looks ${
          articleScore > 0 ? 'favorable' : articleScore < 0 ? 'cautious' : 'mixed'
        }.`
      : 'Limited recent headline data was available, so this leans on price trend.';

  if (recommendation === 'buy') {
    const budgetSlice = 500;
    const suggestedShares = Math.max(1, Math.floor(budgetSlice / request.currentPrice));
    return {
      symbol: request.symbol,
      companyName: request.companyName,
      recommendation,
      summary: `Consider buying ${request.companyName}.`,
      worthTracking: null,
      suggestedShares,
      reasoning: `${articleContext} One-year performance is ${request.yearlyChangePct >= 0 ? '+' : ''}${request.yearlyChangePct.toFixed(1)}%. A starter position of ${suggestedShares} share(s) (~$${(suggestedShares * request.currentPrice).toFixed(0)}) could fit a modest allocation.`,
      industryPicks,
    };
  }

  if (recommendation === 'avoid') {
    return {
      symbol: request.symbol,
      companyName: request.companyName,
      recommendation,
      summary: `We do not recommend buying ${request.companyName} right now.`,
      worthTracking: articleScore >= 0 || request.yearlyChangePct > 0,
      suggestedShares: null,
      reasoning: `${articleContext} Near-term signals suggest waiting for clearer confirmation before committing capital.`,
      industryPicks,
    };
  }

  return {
    symbol: request.symbol,
    companyName: request.companyName,
    recommendation,
    summary: `Hold off on buying ${request.companyName} for now.`,
    worthTracking: true,
    suggestedShares: null,
    reasoning: `${articleContext} Conditions are mixed; monitor upcoming earnings and major headlines before sizing a position.`,
    industryPicks,
  };
}

/**
 * Placeholder for Claude API integration.
 * Set EXPO_PUBLIC_CLAUDE_API_KEY to enable live requests; otherwise returns mock analysis.
 */
export async function fetchStockPrediction(request: PredictionRequest): Promise<StockPrediction> {
  const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY?.trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return buildMockPrediction(request);
  }

  const articleLines = request.articles
    .map((article, index) => `${index + 1}. ${article.title} (${article.sourceName})`)
    .join('\n');

  const prompt = `You are a concise investing assistant. Analyze the stock below using the news headlines and respond ONLY with valid JSON (no markdown):
{
  "recommendation": "buy" | "hold" | "avoid",
  "summary": "one sentence",
  "worthTracking": true | false | null,
  "suggestedShares": number | null,
  "reasoning": "2-3 sentences",
  "industryPicks": [{ "symbol": "TICKER", "name": "Company", "rationale": "short reason" }]
}

Rules:
- If recommendation is "buy", set suggestedShares to a reasonable starter (1-10) and worthTracking to null.
- If not "buy", set suggestedShares to null and set worthTracking true/false.
- industryPicks must have exactly 3 lesser-known peers in the same industry.
- Do not give financial advice disclaimers inside JSON.

Stock: ${request.symbol} (${request.companyName})
Price: $${request.currentPrice}
1Y change %: ${request.yearlyChangePct}
Recent headlines:
${articleLines || 'None available'}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return buildMockPrediction(request);
    }

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const textBlock = payload.content?.find((block) => block.type === 'text');
    const rawText = textBlock?.text?.trim();
    if (!rawText) return buildMockPrediction(request);

    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(jsonText) as Partial<StockPrediction>;

    return {
      symbol: request.symbol,
      companyName: request.companyName,
      recommendation: parsed.recommendation ?? 'hold',
      summary: parsed.summary ?? buildMockPrediction(request).summary,
      worthTracking: parsed.worthTracking ?? null,
      suggestedShares: parsed.suggestedShares ?? null,
      reasoning: parsed.reasoning ?? buildMockPrediction(request).reasoning,
      industryPicks:
        parsed.industryPicks?.length === 3
          ? parsed.industryPicks
          : getIndustryPicks(request.symbol),
    };
  } catch {
    return buildMockPrediction(request);
  }
}
