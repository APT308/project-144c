import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(entry: {
  action: string;
  object_type: string;
  object_id?: string | null;
  metadata?: Record<string, unknown>;
  user_id?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    action: entry.action,
    object_type: entry.object_type,
    object_id: entry.object_id ?? null,
    metadata: entry.metadata ?? {},
    user_id: entry.user_id ?? null,
  });
  if (error) throw new Error(`Audit log write failed: ${error.message}`);
}
