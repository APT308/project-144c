"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, ensureBuckets } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { extractPdfText } from "@/lib/pdf";

const BUCKET = "contract-documents";

export async function uploadDocument(formData: FormData) {
  const project_id = String(formData.get("project_id"));
  const doc_type = String(formData.get("doc_type"));
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) throw new Error("A file is required");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are accepted");
  }

  await ensureBuckets();
  const admin = createAdminClient();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const storage_path = `${project_id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storage_path, buffer, { contentType: "application/pdf" });
  if (uploadError) throw new Error(uploadError.message);

  let parsed_text = "";
  try {
    parsed_text = await extractPdfText(buffer);
  } catch {
    parsed_text = "";
  }

  const { data, error } = await admin
    .from("contract_documents")
    .insert({
      project_id,
      doc_type,
      file_name: file.name,
      storage_path: `${BUCKET}/${storage_path}`,
      parsed_text,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "document.upload",
    object_type: "contract_documents",
    object_id: data.id,
    metadata: { file_name: file.name, doc_type, extracted_chars: parsed_text.length },
  });

  revalidatePath("/documents");
  revalidatePath("/advice");
  revalidatePath("/");
}

export async function deleteDocument(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const storage_path = String(formData.get("storage_path") || "");

  const { error } = await admin.from("contract_documents").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (storage_path) {
    const objectPath = storage_path.startsWith(`${BUCKET}/`)
      ? storage_path.slice(BUCKET.length + 1)
      : storage_path;
    await admin.storage.from(BUCKET).remove([objectPath]);
  }

  await writeAuditLog({
    action: "document.delete",
    object_type: "contract_documents",
    object_id: id,
  });

  revalidatePath("/documents");
  revalidatePath("/");
}

export async function getDocumentDownloadUrl(bucketPath: string): Promise<string | null> {
  const admin = createAdminClient();
  const objectPath = bucketPath.startsWith(`${BUCKET}/`)
    ? bucketPath.slice(BUCKET.length + 1)
    : bucketPath;
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
