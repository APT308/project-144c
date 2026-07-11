"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, ensureBuckets } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { nextWoNumber, draftWorkOrder } from "@/lib/workOrders";
import { generateTextPdf } from "@/lib/generatePdf";

const BUCKET = "work-orders";

export async function generateWorkOrder(formData: FormData) {
  const admin = createAdminClient();
  const project_id = String(formData.get("project_id"));
  const scope = String(formData.get("scope") || "").trim();
  const contractor = String(formData.get("contractor") || "").trim();
  const value = Number(formData.get("value") || 0);
  const issued_date = String(formData.get("issued_date") || "");

  if (!scope || !contractor) throw new Error("Scope and contractor are required");

  const wo_number = await nextWoNumber(project_id);

  const { data: registerRow, error: registerError } = await admin
    .from("work_order_register")
    .insert({
      project_id,
      wo_number,
      issued_date: issued_date || null,
      issued_to: contractor,
      description: scope,
      value,
      status: "pending",
    })
    .select()
    .single();
  if (registerError) throw new Error(registerError.message);

  const draft = await draftWorkOrder({ projectId: project_id, scope, contractor, value, woNumber: wo_number });

  const { data: woRow, error: woError } = await admin
    .from("work_orders")
    .insert({
      project_id,
      register_id: registerRow.id,
      draft_content: draft.content,
      draft_source: draft.source,
      draft_confidence: draft.confidence,
      draft_review_status: "unreviewed",
    })
    .select()
    .single();
  if (woError) throw new Error(woError.message);

  await writeAuditLog({
    action: "work_order.generate",
    object_type: "work_order_register",
    object_id: registerRow.id,
    metadata: { wo_number, contractor, value },
  });

  revalidatePath("/work-orders");
  revalidatePath("/");
  return woRow.id;
}

export async function approveWorkOrder(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));

  const { data: wo, error: fetchError } = await admin
    .from("work_orders")
    .select("*, work_order_register(*)")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  await ensureBuckets();
  const register = wo.work_order_register as { wo_number: string; project_id: string };
  const pdfBytes = await generateTextPdf(`Work Order ${register.wo_number}`, wo.draft_content ?? "");
  const objectPath = `${register.project_id}/${register.wo_number}.pdf`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(objectPath, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const pdf_path = `${BUCKET}/${objectPath}`;

  const { error: updateWoError } = await admin
    .from("work_orders")
    .update({ draft_review_status: "approved", approved_at: new Date().toISOString(), pdf_path })
    .eq("id", id);
  if (updateWoError) throw new Error(updateWoError.message);

  const { error: updateRegisterError } = await admin
    .from("work_order_register")
    .update({ status: "issued" })
    .eq("id", wo.register_id);
  if (updateRegisterError) throw new Error(updateRegisterError.message);

  await writeAuditLog({
    action: "work_order.approve",
    object_type: "work_orders",
    object_id: id,
    metadata: { wo_number: register.wo_number },
  });

  revalidatePath("/work-orders");
}

export async function getWorkOrderFileUrl(bucketPath: string): Promise<string | null> {
  const admin = createAdminClient();
  const objectPath = bucketPath.startsWith(`${BUCKET}/`) ? bucketPath.slice(BUCKET.length + 1) : bucketPath;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(objectPath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
