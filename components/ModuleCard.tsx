import Link from "next/link";

export function ModuleCard({
  href,
  title,
  description,
  count,
  countLabel,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors flex flex-col justify-between"
    >
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      </div>
      <div className="mt-4 text-sm">
        <span className="font-semibold">{count}</span>{" "}
        <span className="text-neutral-500">{countLabel}</span>
      </div>
    </Link>
  );
}
