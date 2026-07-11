"use client";

import { useTransition } from "react";
import { setUserRole, setUserActive, deleteUser } from "@/app/(app)/admin/actions";

type Row = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  user_id: string | null;
  approved_by: string | null;
};

export function AdminUserRow({ row, isSelf }: { row: Row; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-t border-neutral-200">
      <td className="p-3 text-sm">{row.email}</td>
      <td className="p-3 text-sm">
        <select
          defaultValue={row.role}
          disabled={isPending || isSelf}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("id", row.id);
            fd.set("role", e.target.value);
            startTransition(async () => {
              await setUserRole(fd);
            });
          }}
          className="border rounded px-1.5 py-1 text-sm"
        >
          <option value="admin">admin</option>
          <option value="qs_user">qs_user</option>
        </select>
      </td>
      <td className="p-3 text-sm">
        {row.user_id ? (
          <span className="text-green-700">account created</span>
        ) : (
          <span className="text-neutral-400">pending</span>
        )}
      </td>
      <td className="p-3 text-sm">
        <span className={row.is_active ? "text-green-700" : "text-red-600"}>
          {row.is_active ? "active" : "disabled"}
        </span>
      </td>
      <td className="p-3 text-sm text-neutral-400">{row.approved_by}</td>
      <td className="p-3 text-sm">
        <div className="flex gap-3">
          <button
            disabled={isPending || isSelf}
            onClick={() => {
              if (row.is_active && !confirm(`Disable access for ${row.email}?`)) return;
              const fd = new FormData();
              fd.set("id", row.id);
              fd.set("is_active", String(!row.is_active));
              startTransition(async () => {
                await setUserActive(fd);
              });
            }}
            className="underline disabled:opacity-40"
            title={isSelf ? "You can't change your own access" : undefined}
          >
            {row.is_active ? "Disable" : "Enable"}
          </button>
          <button
            disabled={isPending || isSelf}
            onClick={() => {
              if (!confirm(`Permanently delete ${row.email}? This removes their login and cannot be undone.`)) return;
              const fd = new FormData();
              fd.set("id", row.id);
              startTransition(async () => {
                await deleteUser(fd);
              });
            }}
            className="underline text-red-600 disabled:opacity-40"
            title={isSelf ? "You can't delete your own account" : undefined}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
