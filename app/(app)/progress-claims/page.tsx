import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { createClaim, deleteClaim, getClaimFileUrl } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ProgressClaimsPage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("progress_claims")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const rows = await Promise.all(
    (claims ?? []).map(async (c) => ({
      ...c,
      submittedUrl: c.submitted_file_path ? await getClaimFileUrl(c.submitted_file_path) : null,
      certifiedUrl: c.certified_file_path ? await getClaimFileUrl(c.certified_file_path) : null,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Progress Claims</h1>
        <p className="text-sm text-neutral-500">
          Submitted vs certified amounts per claim period, with gap analysis.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="text-xs uppercase text-neutral-500">
              <th className="p-3">Period</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Certified</th>
              <th className="p-3">Gap</th>
              <th className="p-3">Files</th>
              <th className="p-3">Notes</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-neutral-500">
                  No claims recorded yet — add the first claim below.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const gap = Number(c.gap_amount ?? c.submitted_amount - c.certified_amount);
              return (
                <tr key={c.id} className="border-t border-neutral-200">
                  <td className="p-3 text-sm">{c.claim_period}</td>
                  <td className="p-3 text-sm">{formatCurrency(c.submitted_amount)}</td>
                  <td className="p-3 text-sm">{formatCurrency(c.certified_amount)}</td>
                  <td className={`p-3 text-sm font-medium ${gap > 0 ? "text-red-600 bg-red-50" : "text-green-700"}`}>
                    {formatCurrency(gap)}
                  </td>
                  <td className="p-3 text-xs space-y-1">
                    {c.submittedUrl && (
                      <div>
                        <a href={c.submittedUrl} target="_blank" className="underline">
                          Submitted file
                        </a>
                      </div>
                    )}
                    {c.certifiedUrl && (
                      <div>
                        <a href={c.certifiedUrl} target="_blank" className="underline">
                          Certified file
                        </a>
                      </div>
                    )}
                    {!c.submittedUrl && !c.certifiedUrl && <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="p-3 text-sm text-neutral-500">{c.notes || "—"}</td>
                  <td className="p-3">
                    <DeleteButton id={c.id} action={deleteClaim} confirmText="Delete this claim?" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium mb-3">Add claim</h2>
        <form action={createClaim} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="hidden" name="project_id" value={project.id} />
          <label className="text-sm">
            Claim period
            <input name="claim_period" required placeholder="Month 20 — February 2025" className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Submitted amount (RM)
            <input name="submitted_amount" type="number" step="0.01" required className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Certified amount (RM)
            <input name="certified_amount" type="number" step="0.01" required className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Submitted file (PDF)
            <input name="submitted_file" type="file" accept="application/pdf" className="w-full text-sm mt-1" />
          </label>
          <label className="text-sm">
            Certified file (PDF)
            <input name="certified_file" type="file" accept="application/pdf" className="w-full text-sm mt-1" />
          </label>
          <label className="text-sm sm:col-span-1 col-span-1">
            Notes
            <input name="notes" className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <div className="sm:col-span-3">
            <button type="submit" className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm">
              Add claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
