"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";

export async function createParty(formData: FormData) {
  const admin = createAdminClient();
  const project_id = String(formData.get("project_id"));
  const payload = {
    project_id,
    role: String(formData.get("role")),
    company_name: String(formData.get("company_name") || ""),
    address: String(formData.get("address") || ""),
    contact_name: String(formData.get("contact_name") || ""),
    contact_email: String(formData.get("contact_email") || ""),
  };
  const { data, error } = await admin
    .from("party_details")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "party.create",
    object_type: "party_details",
    object_id: data.id,
    metadata: payload,
  });

  revalidatePath("/parties");
}

export async function updateParty(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const payload = {
    role: String(formData.get("role")),
    company_name: String(formData.get("company_name") || ""),
    address: String(formData.get("address") || ""),
    contact_name: String(formData.get("contact_name") || ""),
    contact_email: String(formData.get("contact_email") || ""),
  };
  const { error } = await admin.from("party_details").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "party.update",
    object_type: "party_details",
    object_id: id,
    metadata: payload,
  });

  revalidatePath("/parties");
}

export async function deleteParty(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const { error } = await admin.from("party_details").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "party.delete",
    object_type: "party_details",
    object_id: id,
  });

  revalidatePath("/parties");
}
