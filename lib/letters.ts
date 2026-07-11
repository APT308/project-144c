import OpenAI from "openai";
import { retrieveTopChunk } from "@/lib/rag";

export type PartyInfo = {
  role: string;
  company_name: string | null;
  address: string | null;
  contact_name: string | null;
};

export async function draftLetter(params: {
  projectId: string;
  issueDescription: string;
  party: PartyInfo;
}): Promise<{ content: string; source: string; confidence: number }> {
  const top = await retrieveTopChunk(params.issueDescription, params.projectId);
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
              "You draft formal contractual letters for a construction project team. Address the recipient by company/contact name, cite the contract excerpt if relevant (do not invent clause numbers if none given), and keep a formal, concise register (under 250 words). End with a professional closing.",
          },
          {
            role: "user",
            content: `Recipient: ${params.party.contact_name ?? params.party.company_name} (${params.party.role})\nAddress: ${params.party.address ?? "—"}\n\nIssue: ${params.issueDescription}\n${top ? `\nRelevant contract excerpt (${source}):\n"""${top.chunk.text}"""` : ""}`,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return { content, source, confidence };
    } catch {
      // fall through to template
    }
  }

  return { content: templateLetter(params, top?.chunk.text ?? null, source), source, confidence };
}

function templateLetter(
  params: { issueDescription: string; party: PartyInfo },
  clauseText: string | null,
  source: string,
): string {
  const clauseLine = clauseText ? `\n\nThis matter is referenced against ${source}: "${clauseText}"` : "";
  return `To: ${params.party.contact_name ?? params.party.company_name}\n${params.party.company_name ?? ""}\n${params.party.address ?? ""}\n\nDear Sir/Madam,\n\nRe: ${params.issueDescription}\n\nWe write to formally raise the above matter for your attention and necessary action.${clauseLine}\n\nPlease respond within a reasonable time to avoid further escalation.\n\nYours faithfully,`;
}
