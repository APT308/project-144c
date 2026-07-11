import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { createParty } from "./actions";
import { PartyRow } from "@/components/PartyRow";

export default async function PartiesPage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const { data: parties } = await supabase
    .from("party_details")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Party Details</h1>
        <p className="text-sm text-neutral-500">
          Client, architect, QS and contractor records referenced by work orders and letters.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="text-xs uppercase text-neutral-500">
              <th className="p-3">Role</th>
              <th className="p-3">Company</th>
              <th className="p-3">Address</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(parties ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500">
                  No party details yet — add the first one below.
                </td>
              </tr>
            )}
            {(parties ?? []).map((party) => (
              <PartyRow key={party.id} party={party} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium mb-3">Add party</h2>
        <form action={createParty} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <select name="role" required className="border rounded px-2 py-1 text-sm">
            <option value="client">client</option>
            <option value="architect">architect</option>
            <option value="QS">QS</option>
            <option value="contractor">contractor</option>
            <option value="consultant">consultant</option>
          </select>
          <input name="company_name" placeholder="Company" required className="border rounded px-2 py-1 text-sm" />
          <input name="address" placeholder="Address" className="border rounded px-2 py-1 text-sm" />
          <input name="contact_name" placeholder="Contact name" className="border rounded px-2 py-1 text-sm" />
          <input name="contact_email" placeholder="Contact email" type="email" className="border rounded px-2 py-1 text-sm" />
          <div className="col-span-2 sm:col-span-5">
            <button type="submit" className="text-sm bg-neutral-900 text-white px-3 py-1.5 rounded">
              Add party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
