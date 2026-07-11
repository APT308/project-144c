import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfile = {
  email: string;
  role: "admin" | "qs_user";
};

// Uses the security-definer `current_user_profile()` RPC so this works with
// just the cookie-bound client — safe to call from edge middleware as well
// as Server Components, no service-role key needed here.
export async function getCurrentUserProfile(supabase: SupabaseClient): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const { data } = await supabase.rpc("current_user_profile").maybeSingle();
  if (!data || !data.is_active) return null;

  return { email: user.email, role: data.role === "admin" ? "admin" : "qs_user" };
}
