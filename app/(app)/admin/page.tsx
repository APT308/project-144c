import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/auth";
import { createUser } from "./actions";
import { AdminUserRow } from "@/components/AdminUserRow";

export default async function AdminPage() {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile(supabase);
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("approved_emails")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Admin — User Management</h1>
        <p className="text-sm text-neutral-500">
          Approve, disable, and manage roles for the QS department&apos;s shared workspace. There is
          no public sign-up — every account is created here.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="text-xs uppercase text-neutral-500">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Account</th>
              <th className="p-3">Status</th>
              <th className="p-3">Approved by</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-500">
                  No users yet.
                </td>
              </tr>
            )}
            {(users ?? []).map((u) => (
              <AdminUserRow key={u.id} row={u} isSelf={u.email === profile.email} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium mb-3">Create user</h2>
        <form action={createUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="text-sm">
            Email
            <input name="email" type="email" required className="w-full border rounded px-2 py-1.5 text-sm mt-1" />
          </label>
          <label className="text-sm">
            Role
            <select name="role" defaultValue="qs_user" className="w-full border rounded px-2 py-1.5 text-sm mt-1">
              <option value="qs_user">qs_user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="text-sm">
            Temporary password
            <input
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="min. 8 characters"
              className="w-full border rounded px-2 py-1.5 text-sm mt-1"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm w-full">
              Create user
            </button>
          </div>
        </form>
        <p className="text-xs text-neutral-400 mt-2">
          Share the password with the team member yourself (Slack, in person, etc.) — no invite email
          is sent in v1.
        </p>
      </div>
    </div>
  );
}
