"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile(supabase);
  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return profile.email;
}

export async function createUser(formData: FormData) {
  const adminEmail = await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "qs_user");
  const password = String(formData.get("password") || "");
  if (!email || !password) throw new Error("Email and password are required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = created?.user?.id ?? null;

  if (createError) {
    // Account may already exist (e.g. re-approving a previously disabled user).
    if (!/already registered|already exists/i.test(createError.message)) {
      throw new Error(createError.message);
    }
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (userId) {
      await admin.auth.admin.updateUserById(userId, { ban_duration: "none", password });
    }
  }

  const { error: upsertError } = await admin
    .from("approved_emails")
    .upsert(
      { email, role, is_active: true, approved_by: adminEmail, user_id: userId },
      { onConflict: "email" },
    );
  if (upsertError) throw new Error(upsertError.message);

  await writeAuditLog({
    action: "admin.user_create",
    object_type: "approved_emails",
    metadata: { email, role },
  });

  revalidatePath("/admin");
}

export async function setUserRole(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));

  const { error } = await admin.from("approved_emails").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "admin.user_role_change",
    object_type: "approved_emails",
    object_id: id,
    metadata: { role },
  });

  revalidatePath("/admin");
}

export async function deleteUser(formData: FormData) {
  const adminEmail = await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));

  const { data: row, error: fetchError } = await admin
    .from("approved_emails")
    .select("user_id, email")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  if (row.email.toLowerCase() === adminEmail.toLowerCase()) {
    throw new Error("You can't delete your own account");
  }

  if (row.user_id) {
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(row.user_id);
    // Ignore "user not found" - approved_emails row may be ahead of auth state.
    if (deleteAuthError && !/not.*found/i.test(deleteAuthError.message)) {
      throw new Error(deleteAuthError.message);
    }
  }

  const { error } = await admin.from("approved_emails").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    action: "admin.user_delete",
    object_type: "approved_emails",
    object_id: id,
    metadata: { email: row.email },
  });

  revalidatePath("/admin");
}

export async function setUserActive(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";

  const { data: row, error: fetchError } = await admin
    .from("approved_emails")
    .select("user_id, email")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await admin.from("approved_emails").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  if (row.user_id) {
    await admin.auth.admin.updateUserById(row.user_id, {
      ban_duration: isActive ? "none" : "876000h",
    });
  }

  await writeAuditLog({
    action: isActive ? "admin.user_enable" : "admin.user_disable",
    object_type: "approved_emails",
    object_id: id,
    metadata: { email: row.email },
  });

  revalidatePath("/admin");
}
