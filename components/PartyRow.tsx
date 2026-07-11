"use client";

import { useState } from "react";
import { updateParty, deleteParty } from "@/app/parties/actions";

type Party = {
  id: string;
  role: string;
  company_name: string | null;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
};

export function PartyRow({ party }: { party: Party }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-neutral-200 align-top">
        <td colSpan={5} className="p-3">
          <form
            action={async (fd) => {
              await updateParty(fd);
              setEditing(false);
            }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
          >
            <input type="hidden" name="id" value={party.id} />
            <select name="role" defaultValue={party.role} className="border rounded px-2 py-1 text-sm">
              <option value="client">client</option>
              <option value="architect">architect</option>
              <option value="QS">QS</option>
              <option value="contractor">contractor</option>
              <option value="consultant">consultant</option>
            </select>
            <input name="company_name" defaultValue={party.company_name ?? ""} placeholder="Company" className="border rounded px-2 py-1 text-sm" />
            <input name="address" defaultValue={party.address ?? ""} placeholder="Address" className="border rounded px-2 py-1 text-sm" />
            <input name="contact_name" defaultValue={party.contact_name ?? ""} placeholder="Contact name" className="border rounded px-2 py-1 text-sm" />
            <input name="contact_email" defaultValue={party.contact_email ?? ""} placeholder="Contact email" className="border rounded px-2 py-1 text-sm" />
            <div className="col-span-2 sm:col-span-5 flex gap-2 mt-1">
              <button type="submit" className="text-sm bg-neutral-900 text-white px-3 py-1 rounded">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm px-3 py-1 rounded border">
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-neutral-200">
      <td className="p-3 text-sm">{party.role}</td>
      <td className="p-3 text-sm">{party.company_name}</td>
      <td className="p-3 text-sm text-neutral-500">{party.address}</td>
      <td className="p-3 text-sm">
        {party.contact_name}
        <br />
        <span className="text-neutral-500">{party.contact_email}</span>
      </td>
      <td className="p-3 text-sm">
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="underline">
            Edit
          </button>
          <button
            className="text-red-600 underline"
            onClick={() => {
              if (!confirm("Delete this party?")) return;
              const fd = new FormData();
              fd.set("id", party.id);
              deleteParty(fd);
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
