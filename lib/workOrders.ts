import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveTopChunk } from "@/lib/rag";

export async function nextWoNumber(projectId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("work_order_register")
    .select("wo_number")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  const maxN = (data ?? []).reduce((max, row) => {
    const match = String(row.wo_number).match(/(\d+)$/);
    const n = match ? Number(match[1]) : 0;
    return Math.max(max, n);
  }, 0);

  return `WO-${String(maxN + 1).padStart(3, "0")}`;
}

export async function draftWorkOrder(params: {
  projectId: string;
  scope: string;
  contractor: string;
  value: number;
  woNumber: string;
}): Promise<{ content: string; source: string; confidence: number }> {
  const top = await retrieveTopChunk(params.scope, params.projectId);
  const source = top?.source ?? "";
  const confidence = top?.confidence ?? 0;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const client = new OpenAI({ apiKey });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You draft formal construction work order letters. Reference the contract excerpt if it is relevant, otherwise draft on the scope alone without inventing clause numbers. Keep it under 200 words, formal register.",
          },
          {
            role: "user",
            content: `Work Order Number: ${params.woNumber}\nContractor: ${params.contractor}\nValue: RM ${params.value.toLocaleString()}\nScope: ${params.scope}\n${top ? `\nRelevant contract excerpt (${source}):\n"""${top.chunk.text}"""` : ""}`,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return { content, source, confidence };
    } catch {
      // fall through to template
    }
  }

  return { content: templateWorkOrder(params, top?.chunk.text ?? null, source), source, confidence };
}

function templateWorkOrder(
  params: { projectId: string; scope: string; contractor: string; value: number; woNumber: string },
  clauseText: string | null,
  source: string,
): string {
  const clauseLine = clauseText ? `\n\nReference: ${source} — "${clauseText}"` : "";
  return `WORK ORDER ${params.woNumber}\n\nTo: ${params.contractor}\n\nYou are instructed to proceed with the following works:\n\n${params.scope}\n\nContract value: RM ${params.value.toLocaleString()}\n\nThis instruction is issued under the terms of the main contract.${clauseLine}`;
}
