"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { draftLetter } from "@/lib/letters";

export async function createLetterDraft(formData: FormData) {
  const admin = createAdminClient();
  const project_id = String(formData.get("project_id"));
  const party_id = String(formData.get("party_id"));
  const issue_description = String(formData.get("issue_description") || "").trim();
  if (!issue_description) throw new Error("Issue description is required");

  const { data: party, error: partyError } = await admin
    .from("party_details")
    .select("*")
    .eq("id", party_id)
    .single();
  if (partyError) throw new Error(partyError.message);

  const draft = await draftLetter({
    projectId: project_id,
    issueDescription: issue_description,
    party: {
      role: party.role,
      company_name: party.company_name,
      address: party.address,
      contact_name: party.contact_name,
    },
  });

  const { data, error } = await admin
    .from("contractual_letters")
    .insert({
      project_id,
      issue_description,
      recipient_party: `${party.role}: ${party.company_name ?? party.contact_name ?? ""}`,
      draft_content: draft.content,
      draft_source: draft.source,
      draft_confidence: draft.confidence,
      draft_review_status: "unreviewed",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "letter.draft",
    object_type: "contractual_letters",
    object_id: data.id,
    metadata: { issue_description, recipient_party: data.recipient_party },
  });

  revalidatePath("/letters");
  revalidatePath("/");
}

export async function approveLetter(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const draft_content = String(formData.get("draft_content") || "");

  const { error } = await admin
    .from("contractual_letters")
    .update({ draft_content, draft_review_status: "approved" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "letter.approve",
    object_type: "contractual_letters",
    object_id: id,
  });

  revalidatePath("/letters");
}

export async function markLetterSent(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id"));

  const { error } = await admin
    .from("contractual_letters")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "letter.send",
    object_type: "contractual_letters",
    object_id: id,
  });

  revalidatePath("/letters");
}
