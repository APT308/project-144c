"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { ragQuery } from "@/lib/rag";

export async function askQuestion(formData: FormData) {
  const admin = createAdminClient();
  const project_id = String(formData.get("project_id"));
  const question = String(formData.get("question") || "").trim();
  if (!question) throw new Error("Question is required");

  const result = await ragQuery(question, project_id);
  const review_status = result.confidence < 0.7 ? "needs_review" : "unreviewed";

  const { data, error } = await admin
    .from("contractual_advice_requests")
    .insert({
      project_id,
      question,
      answer: result.answer,
      answer_source: result.source,
      answer_confidence: result.confidence,
      answer_review_status: review_status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "advice.request",
    object_type: "contractual_advice_requests",
    object_id: data.id,
    metadata: { question, confidence: result.confidence },
  });

  revalidatePath("/advice");
}
