import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { askQuestion } from "./actions";
import { AskForm } from "@/components/AskForm";

export default async function AdvicePage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const { count: docCount } = await supabase
    .from("contract_documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { data: requests } = await supabase
    .from("contractual_advice_requests")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Contractual Advice</h1>
        <p className="text-sm text-neutral-500">
          Ask a question and get an answer grounded in the uploaded contract documents.
        </p>
      </div>

      {!docCount ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
          No contract documents in knowledgebase — please{" "}
          <a href="/documents" className="underline">
            upload first
          </a>
          .
        </div>
      ) : (
        <AskForm action={askQuestion} projectId={project.id} />
      )}

      <div className="space-y-4">
        {(requests ?? []).length === 0 && (
          <p className="text-neutral-500 text-sm">No advice requests yet.</p>
        )}
        {(requests ?? []).map((req) => (
          <div key={req.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="font-medium">{req.question}</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{req.answer}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
              {req.answer_source && <span>Source: {req.answer_source}</span>}
              <span>Confidence: {Number(req.answer_confidence ?? 0).toFixed(2)}</span>
              {req.answer_review_status === "needs_review" && (
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Needs Review
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
