import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Ops Dashboard",
  description: "Construction project operations dashboard",
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto">
            <Link href="/" className="font-semibold whitespace-nowrap">
              Project Ops
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-600">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap hover:text-neutral-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
