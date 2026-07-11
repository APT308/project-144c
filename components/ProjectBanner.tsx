import type { Project } from "@/lib/data/project";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProjectBanner({ project }: { project: Project }) {
  const gap = project.current_claim_amount - project.certified_amount;
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {formatDate(project.start_date)} → {formatDate(project.completion_date)}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
          <div>
            <div className="text-neutral-500">LD / day</div>
            <div className="font-medium">{formatCurrency(project.ld_per_day)}</div>
          </div>
          <div>
            <div className="text-neutral-500">Current Claim</div>
            <div className="font-medium">{formatCurrency(project.current_claim_amount)}</div>
          </div>
          <div>
            <div className="text-neutral-500">Certified</div>
            <div className="font-medium">{formatCurrency(project.certified_amount)}</div>
          </div>
          <div>
            <div className="text-neutral-500">Gap</div>
            <div className={`font-medium ${gap > 0 ? "text-red-600" : "text-green-700"}`}>
              {formatCurrency(gap)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
