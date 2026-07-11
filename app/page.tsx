import { ProjectBanner } from "@/components/ProjectBanner";
import { ModuleCard } from "@/components/ModuleCard";
import { getCurrentProject, getModuleCounts } from "@/lib/data/project";

export default async function Home() {
  const project = await getCurrentProject();

  if (!project) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
        No project found. Add a project row in Supabase to get started.
      </div>
    );
  }

  const counts = await getModuleCounts(project.id);

  return (
    <div>
      <ProjectBanner project={project} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ModuleCard
          href="/documents"
          title="Contract Documents"
          description="Upload conditions of contract, BOQ, drawings for the knowledgebase."
          count={counts.documents}
          countLabel="documents"
        />
        <ModuleCard
          href="/advice"
          title="Contractual Advice"
          description="Ask a question, get an answer grounded in the contract documents."
          count={counts.advice}
          countLabel="requests"
        />
        <ModuleCard
          href="/progress-claims"
          title="Progress Claims"
          description="Submitted vs certified amounts and gap analysis by claim period."
          count={counts.claims}
          countLabel="claims"
        />
        <ModuleCard
          href="/quotations"
          title="Quotations"
          description="Upload quotes for side-by-side comparison and a recommendation."
          count={counts.quotations}
          countLabel="quotations"
        />
        <ModuleCard
          href="/work-orders"
          title="Work Orders"
          description="Generate a work order, get a sequential WO number, update the register."
          count={counts.workOrders}
          countLabel="issued"
        />
        <ModuleCard
          href="/letters"
          title="Contractual Letters"
          description="Draft a clause-cited letter referencing the correct party."
          count={counts.letters}
          countLabel="letters"
        />
      </div>
    </div>
  );
}
