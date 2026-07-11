import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { generateWorkOrder, getWorkOrderFileUrl } from "./actions";
import { WorkOrderCard } from "@/components/WorkOrderCard";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(amount);
}

export default async function WorkOrdersPage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const { data: register } = await supabase
    .from("work_order_register")
    .select("*, work_orders(*)")
    .eq("project_id", project.id)
    .order("wo_number", { ascending: true });

  const rows = await Promise.all(
    (register ?? []).map(async (r) => {
      const wo = Array.isArray(r.work_orders) ? r.work_orders[0] : r.work_orders;
      return {
        ...r,
        wo,
        pdfUrl: wo?.pdf_path ? await getWorkOrderFileUrl(wo.pdf_path) : null,
      };
    }),
  );

  const pendingDrafts = rows.filter((r) => r.wo && r.wo.draft_review_status === "unreviewed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Work Orders</h1>
        <p className="text-sm text-neutral-500">
          Generate a work order — it gets a sequential WO number and a draft for your review.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium mb-3">Generate work order</h2>
        <form action={generateWorkOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="hidden" name="project_id" value={project.id} />
          <label className="text-sm sm:col-span-2">
            Scope of works
            <textarea name="scope" required rows={2} className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Contractor
            <input name="contractor" required className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Value (RM)
            <input name="value" type="number" step="0.01" required className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Date
            <input name="issued_date" type="date" className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm">
              Generate draft
            </button>
          </div>
        </form>
      </div>

      {pendingDrafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium">Pending review</h2>
          {pendingDrafts.map((r) => (
            <WorkOrderCard key={r.wo!.id} woNumber={r.wo_number} workOrder={r.wo!} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="text-xs uppercase text-neutral-500">
              <th className="p-3">WO Number</th>
              <th className="p-3">Contractor</th>
              <th className="p-3">Description</th>
              <th className="p-3">Value</th>
              <th className="p-3">Status</th>
              <th className="p-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-500">
                  No work orders issued yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-200">
                <td className="p-3 text-sm font-medium">{r.wo_number}</td>
                <td className="p-3 text-sm">{r.issued_to}</td>
                <td className="p-3 text-sm text-neutral-500">{r.description}</td>
                <td className="p-3 text-sm">{formatCurrency(Number(r.value ?? 0))}</td>
                <td className="p-3 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      r.status === "issued" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {r.pdfUrl ? (
                    <a href={r.pdfUrl} target="_blank" className="underline">
                      Download
                    </a>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
