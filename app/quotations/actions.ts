"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, ensureBuckets } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { extractPdfText } from "@/lib/pdf";
import { compareQuotations } from "@/lib/quotations";

const BUCKET = "quotations";

export async function uploadQuotation(formData: FormData) {
  const admin = createAdminClient();
  const project_id = String(formData.get("project_id"));
  const description = String(formData.get("description") || "");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length < 2) throw new Error("Upload at least 2 quotation files to compare");
  for (const f of files) {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Only PDF files are accepted");
    }
  }

  await ensureBuckets();

  const filePaths: string[] = [];
  const parsedFiles: { fileName: string; text: string }[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const objectPath = `${project_id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(objectPath, buffer, { contentType: "application/pdf" });
    if (uploadError) throw new Error(uploadError.message);
    filePaths.push(`${BUCKET}/${objectPath}`);

    let text = "";
    try {
      text = await extractPdfText(buffer);
    } catch {
      text = "";
    }
    parsedFiles.push({ fileName: file.name, text });
  }

  const result = await compareQuotations(parsedFiles);
  const comparison_review_status = result.comparisonConfidence < 0.7 ? "needs_review" : "unreviewed";
  const recommendation_review_status = result.recommendationConfidence < 0.7 ? "needs_review" : "unreviewed";

  const { data, error } = await admin
    .from("quotations")
    .insert({
      project_id,
      description,
      file_paths: filePaths,
      comparison_output: result.comparison,
      comparison_source: result.comparisonSource,
      comparison_confidence: result.comparisonConfidence,
      comparison_review_status,
      recommendation: result.recommendation,
      recommendation_source: result.recommendationSource,
      recommendation_confidence: result.recommendationConfidence,
      recommendation_review_status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "quotation.compare",
    object_type: "quotations",
    object_id: data.id,
    metadata: { file_count: files.length, description },
  });

  revalidatePath("/quotations");
  revalidatePath("/");
}

export async function overrideRecommendation(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const recommendation = String(formData.get("recommendation") || "");

  const { error } = await admin
    .from("quotations")
    .update({ recommendation, recommendation_review_status: "overridden" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "quotation.override_recommendation",
    object_type: "quotations",
    object_id: id,
  });

  revalidatePath("/quotations");
}

export async function deleteQuotation(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const { error } = await admin.from("quotations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "quotation.delete",
    object_type: "quotations",
    object_id: id,
  });

  revalidatePath("/quotations");
  revalidatePath("/");
}
