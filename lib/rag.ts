import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";

export type Chunk = {
  text: string;
  docType: string;
  fileName: string;
  clauseRef: string | null;
};

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "of", "to", "in", "for",
  "on", "and", "or", "what", "which", "who", "shall", "will", "be", "by",
  "at", "as", "with", "that", "this", "it", "any", "all",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function termFreq(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

// Rule-based cosine similarity over bag-of-words term-frequency vectors.
// No external embedding call required — matches the "rule-based first"
// scoring approach in docs/INTELLIGENCE_LAYER.md.
function cosineSimilarity(a: string[], b: string[]): number {
  const fa = termFreq(a);
  const fb = termFreq(b);
  const terms = new Set([...fa.keys(), ...fb.keys()]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const term of terms) {
    const va = fa.get(term) ?? 0;
    const vb = fb.get(term) ?? 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function splitIntoChunks(parsedText: string, docType: string, fileName: string): Chunk[] {
  // Split on clause markers first; fall back to sentence-level chunks.
  const clauseSplit = parsedText.split(/(?=Clause\s+\d+(?:\.\d+)*)/i).filter((s) => s.trim());
  const pieces = clauseSplit.length > 1 ? clauseSplit : parsedText.split(/(?<=[.!?])\s+/).filter((s) => s.trim());

  return pieces.map((text) => {
    const clauseMatch = text.match(/Clause\s+\d+(?:\.\d+)*/i);
    return {
      text: text.trim(),
      docType,
      fileName,
      clauseRef: clauseMatch ? clauseMatch[0] : null,
    };
  });
}

export type RagResult = {
  answer: string;
  source: string;
  confidence: number;
};

export type RetrievedChunk = {
  chunk: Chunk;
  source: string;
  confidence: number;
};

// Shared retrieval step used by contractual advice, WO drafting, and
// letter drafting — all three ground their output in the same
// contract-document knowledgebase.
export async function retrieveTopChunk(query: string, projectId: string): Promise<RetrievedChunk | null> {
  const admin = createAdminClient();
  const { data: documents, error } = await admin
    .from("contract_documents")
    .select("doc_type, file_name, parsed_text")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  if (!documents || documents.length === 0) return null;

  const chunks: Chunk[] = documents.flatMap((doc) =>
    doc.parsed_text ? splitIntoChunks(doc.parsed_text, doc.doc_type, doc.file_name ?? doc.doc_type) : [],
  );
  if (chunks.length === 0) return null;

  const queryTokens = tokenize(query);
  const scored = chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryTokens, tokenize(chunk.text)) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const confidence = Math.round(top.score * 100) / 100;
  const source = top.chunk.clauseRef
    ? `${formatDocType(top.chunk.docType)} — ${top.chunk.clauseRef}`
    : `${formatDocType(top.chunk.docType)} — ${top.chunk.fileName}`;

  return { chunk: top.chunk, source, confidence };
}

export async function ragQuery(question: string, projectId: string): Promise<RagResult> {
  const top = await retrieveTopChunk(question, projectId);
  if (!top) {
    return {
      answer: "No contract documents in knowledgebase — please upload first.",
      source: "",
      confidence: 0,
    };
  }

  const answer = await generateAnswer(question, top.chunk, top.source);
  return { answer, source: top.source, confidence: top.confidence };
}

function formatDocType(docType: string): string {
  return docType
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

async function generateAnswer(question: string, chunk: Chunk, source: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return templatedAnswer(chunk, source);
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
            "You are a contract administration assistant. Answer the user's question ONLY using the provided contract excerpt. Cite the clause or document by name. If the excerpt does not answer the question, say so plainly. Keep the answer to 2-4 sentences.",
        },
        {
          role: "user",
          content: `Contract excerpt (${source}):\n"""${chunk.text}"""\n\nQuestion: ${question}`,
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || templatedAnswer(chunk, source);
  } catch {
    // AI service unavailable — degrade to the rule-based templated answer
    // rather than crash the request (per docs/TEST_PLAN.md error-state test).
    return templatedAnswer(chunk, source);
  }
}

function templatedAnswer(chunk: Chunk, source: string): string {
  return `Based on ${source}: "${chunk.text}"`;
}
