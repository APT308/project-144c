import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { uploadQuotation } from "./actions";
import { QuotationCard } from "@/components/QuotationCard";

export default async function QuotationsPage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const { data: quotations } = await supabase
    .from("quotations")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Quotations</h1>
        <p className="text-sm text-neutral-500">
          Upload 2 or more quotation PDFs for a side-by-side comparison and recommendation.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium mb-3">Upload quotations</h2>
        <form action={uploadQuotation} className="space-y-3">
          <input type="hidden" name="project_id" value={project.id} />
          <input
            name="description"
            placeholder="e.g. Facade cladding — Level 10-15 variation"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
          <input
            type="file"
            name="files"
            accept="application/pdf"
            multiple
            required
            className="text-sm"
          />
          <p className="text-xs text-neutral-400">Select 2 or more PDF files (hold Ctrl/Cmd to multi-select).</p>
          <button type="submit" className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm">
            Compare
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {(quotations ?? []).length === 0 && (
          <p className="text-neutral-500 text-sm">No quotations compared yet.</p>
        )}
        {(quotations ?? []).map((q) => (
          <QuotationCard key={q.id} quotation={q} />
        ))}
      </div>
    </div>
  );
}
