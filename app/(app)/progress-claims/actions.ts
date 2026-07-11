"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, ensureBuckets } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";

const BUCKET = "progress-claims";

async function uploadIfPresent(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  await ensureBuckets();
  const path = `${projectId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/pdf",
  });
  if (error) throw new Error(error.message);
  return `${BUCKET}/${path}`;
}

export async function createClaim(formData: FormData) {
  const admin = createAdminClient();
  const project_id = String(formData.get("project_id"));
  const claim_period = String(formData.get("claim_period"));
  const submitted_amount = Number(formData.get("submitted_amount") || 0);
  const certified_amount = Number(formData.get("certified_amount") || 0);
  const notes = String(formData.get("notes") || "");

  const submitted_file_path = await uploadIfPresent(
    admin,
    project_id,
    formData.get("submitted_file") as File | null,
  );
  const certified_file_path = await uploadIfPresent(
    admin,
    project_id,
    formData.get("certified_file") as File | null,
  );

  const { data, error } = await admin
    .from("progress_claims")
    .insert({
      project_id,
      claim_period,
      submitted_amount,
      certified_amount,
      notes,
      submitted_file_path,
      certified_file_path,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "progress_claim.create",
    object_type: "progress_claims",
    object_id: data.id,
    metadata: { claim_period, submitted_amount, certified_amount },
  });

  revalidatePath("/progress-claims");
  revalidatePath("/");
}

export async function deleteClaim(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const { error } = await admin.from("progress_claims").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "progress_claim.delete",
    object_type: "progress_claims",
    object_id: id,
  });

  revalidatePath("/progress-claims");
  revalidatePath("/");
}

export async function getClaimFileUrl(bucketPath: string): Promise<string | null> {
  const admin = createAdminClient();
  const objectPath = bucketPath.startsWith(`${BUCKET}/`)
    ? bucketPath.slice(BUCKET.length + 1)
    : bucketPath;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(objectPath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
