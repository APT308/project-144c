import OpenAI from "openai";

export type QuoteLineItem = { description: string; amount: number };

export type ParsedQuote = {
  fileName: string;
  totalPrice: number;
  lineItems: QuoteLineItem[];
};

export type ComparisonOutput = {
  quotes: {
    fileName: string;
    totalPrice: number;
    lineItems: QuoteLineItem[];
    missingTerms: string[];
  }[];
  commonTerms: string[];
};

const CURRENCY_RE = /RM\s?[\d,]+(?:\.\d+)?|\b[\d,]{4,}(?:\.\d+)?\b/i;

function normalizeTerm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseQuoteText(fileName: string, text: string): ParsedQuote {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lineItems: QuoteLineItem[] = [];
  let explicitTotal: number | null = null;

  for (const line of lines) {
    const match = line.match(CURRENCY_RE);
    if (!match) continue;
    const amount = Number(match[0].replace(/RM\s?/i, "").replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const description = line.replace(match[0], "").trim().replace(/[-:.\s]+$/, "");
    if (/total/i.test(line)) {
      explicitTotal = amount;
      continue;
    }
    if (description) lineItems.push({ description, amount });
  }

  const totalPrice = explicitTotal ?? lineItems.reduce((sum, li) => sum + li.amount, 0);
  return { fileName, totalPrice, lineItems };
}

function buildComparison(quotes: ParsedQuote[]): ComparisonOutput {
  const termSets = quotes.map(
    (q) => new Set(q.lineItems.map((li) => normalizeTerm(li.description))),
  );
  const allTerms = new Set<string>();
  termSets.forEach((set) => set.forEach((t) => allTerms.add(t)));
  const commonTerms = [...allTerms].filter((t) => termSets.every((set) => set.has(t)));

  return {
    quotes: quotes.map((q, i) => ({
      fileName: q.fileName,
      totalPrice: q.totalPrice,
      lineItems: q.lineItems,
      missingTerms: [...allTerms].filter((t) => !termSets[i].has(t)),
    })),
    commonTerms,
  };
}

// Scoring per docs/INTELLIGENCE_LAYER.md: lowest total price + no missing
// terms = score 1; each missing term -0.1.
function scoreQuotes(comparison: ComparisonOutput): { fileName: string; score: number }[] {
  const priced = comparison.quotes.filter((q) => q.totalPrice > 0);
  const minPrice = priced.length ? Math.min(...priced.map((q) => q.totalPrice)) : 0;

  return comparison.quotes.map((q) => {
    let score = q.totalPrice === minPrice && q.totalPrice > 0 ? 1 : 0.7;
    score -= q.missingTerms.length * 0.1;
    return { fileName: q.fileName, score: Math.max(0, Math.round(score * 100) / 100) };
  });
}

export async function compareQuotations(
  files: { fileName: string; text: string }[],
): Promise<{
  comparison: ComparisonOutput;
  comparisonSource: string;
  comparisonConfidence: number;
  recommendation: string;
  recommendationSource: string;
  recommendationConfidence: number;
}> {
  const parsed = files.map((f) => parseQuoteText(f.fileName, f.text));
  const comparison = buildComparison(parsed);
  const scores = scoreQuotes(comparison);
  const best = scores.reduce((a, b) => (b.score > a.score ? b : a), scores[0]);

  const comparisonConfidence = parsed.every((p) => p.lineItems.length > 0 || p.totalPrice > 0) ? 0.85 : 0.4;
  const recommendationConfidence = best?.score ?? 0.5;

  const recommendation = await generateRecommendation(comparison, scores, best);

  return {
    comparison,
    comparisonSource: files.map((f) => f.fileName).join(", "),
    comparisonConfidence,
    recommendation,
    recommendationSource: best ? best.fileName : "",
    recommendationConfidence,
  };
}

async function generateRecommendation(
  comparison: ComparisonOutput,
  scores: { fileName: string; score: number }[],
  best: { fileName: string; score: number } | undefined,
): Promise<string> {
  const summaryLines = comparison.quotes
    .map((q, i) => `${q.fileName}: RM ${q.totalPrice.toLocaleString()}, ${q.missingTerms.length} missing term(s), score ${scores[i]?.score ?? 0}`)
    .join("\n");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !best) {
    return templatedRecommendation(comparison, best);
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a quantity surveyor's assistant. Given a rule-based quotation comparison summary, write a 2-3 sentence recommendation explaining which quote to choose, citing the price and any missing terms. Only use the figures given, do not invent numbers.",
        },
        { role: "user", content: summaryLines },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || templatedRecommendation(comparison, best);
  } catch {
    return templatedRecommendation(comparison, best);
  }
}

function templatedRecommendation(
  comparison: ComparisonOutput,
  best: { fileName: string; score: number } | undefined,
): string {
  if (!best) return "Not enough data extracted from the uploaded quotations to make a recommendation.";
  const bestQuote = comparison.quotes.find((q) => q.fileName === best.fileName);
  const missing = bestQuote?.missingTerms.length
    ? ` It is missing ${bestQuote.missingTerms.length} term(s) present in other quotes.`
    : " It contains all terms found across the compared quotes.";
  return `Recommended: ${best.fileName} at RM ${bestQuote?.totalPrice.toLocaleString() ?? "?"} (score ${best.score}).${missing}`;
}
