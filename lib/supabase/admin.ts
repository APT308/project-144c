import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service_role key. Bypasses RLS.
// NEVER import this file from a "use client" component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const BUCKETS = ["contract-documents", "progress-claims", "party-details", "quotations"] as const;

let bucketsEnsured = false;

// Idempotent — creates the storage buckets the first time a server action
// needs them. Buckets are private; access always goes through this
// service-role client server-side, never a public bucket URL.
export async function ensureBuckets() {
  if (bucketsEnsured) return;
  const admin = createAdminClient();
  const { data: existing } = await admin.storage.listBuckets();
  const existingIds = new Set((existing ?? []).map((b) => b.id));
  for (const id of BUCKETS) {
    if (!existingIds.has(id)) {
      await admin.storage.createBucket(id, { public: false });
    }
  }
  bucketsEnsured = true;
}
