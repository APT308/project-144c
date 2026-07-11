import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/documents", label: "Contract Documents" },
  { href: "/advice", label: "Contractual Advice" },
  { href: "/progress-claims", label: "Progress Claims" },
  { href: "/quotations", label: "Quotations" },
  { href: "/work-orders", label: "Work Orders" },
  { href: "/letters", label: "Letters" },
  { href: "/parties", label: "Parties" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile(supabase);

  const links = profile?.role === "admin" ? [...NAV_LINKS, { href: "/admin", label: "Admin" }] : NAV_LINKS;

  return (
    <>
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto">
          <Link href="/" className="font-semibold whitespace-nowrap">
            Project Ops
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-600 flex-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-neutral-900">
                {link.label}
              </Link>
            ))}
          </nav>
          {profile && (
            <div className="flex items-center gap-3 text-sm text-neutral-500 whitespace-nowrap">
              <span>
                {profile.email} <span className="text-neutral-400">({profile.role})</span>
              </span>
              <form action={logout}>
                <button type="submit" className="underline">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
