import { createClient } from "@/lib/supabase/server";

export type Project = {
  id: string;
  name: string;
  start_date: string | null;
  completion_date: string | null;
  ld_per_day: number;
  current_claim_amount: number;
  certified_amount: number;
};

export async function getCurrentProject(): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getModuleCounts(projectId: string) {
  const supabase = await createClient();
  const [documents, advice, claims, quotations, workOrders, letters] =
    await Promise.all([
      supabase
        .from("contract_documents")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("contractual_advice_requests")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("progress_claims")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("quotations")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("work_order_register")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("contractual_letters")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

  return {
    documents: documents.count ?? 0,
    advice: advice.count ?? 0,
    claims: claims.count ?? 0,
    quotations: quotations.count ?? 0,
    workOrders: workOrders.count ?? 0,
    letters: letters.count ?? 0,
  };
}
