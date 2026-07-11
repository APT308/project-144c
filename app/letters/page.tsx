import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { createLetterDraft } from "./actions";
import { LetterCard } from "@/components/LetterCard";

export default async function LettersPage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const [{ data: parties }, { data: letters }] = await Promise.all([
    supabase.from("party_details").select("*").eq("project_id", project.id).order("role"),
    supabase.from("contractual_letters").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Contractual Letters</h1>
        <p className="text-sm text-neutral-500">
          Describe an issue and select a recipient — get a clause-cited draft referencing their details.
        </p>
      </div>

      {(parties ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
          No party details yet —{" "}
          <a href="/parties" className="underline">
            add a party
          </a>{" "}
          before drafting a letter.
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="font-medium mb-3">Draft letter</h2>
          <form action={createLetterDraft} className="space-y-3">
            <input type="hidden" name="project_id" value={project.id} />
            <label className="text-sm block">
              Issue description
              <textarea
                name="issue_description"
                required
                rows={2}
                placeholder="e.g. Contractor failed to give EOT notice"
                className="w-full border rounded px-2 py-1.5 text-sm mt-1"
              />
            </label>
            <label className="text-sm block">
              Recipient
              <select name="party_id" required className="w-full border rounded px-2 py-1.5 text-sm mt-1">
                {(parties ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.role}: {p.company_name} ({p.contact_name})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm">
              Draft letter
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {(letters ?? []).length === 0 && <p className="text-neutral-500 text-sm">No letters drafted yet.</p>}
        {(letters ?? []).map((letter) => (
          <LetterCard key={letter.id} letter={letter} />
        ))}
      </div>
    </div>
  );
}
