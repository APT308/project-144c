"use client";

import { useTransition } from "react";
import { approveWorkOrder } from "@/app/(app)/work-orders/actions";

type WorkOrder = {
  id: string;
  draft_content: string | null;
  draft_source: string | null;
  draft_confidence: number | null;
  draft_review_status: string | null;
};

export function WorkOrderCard({ woNumber, workOrder }: { woNumber: string; workOrder: WorkOrder }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium">{woNumber} — Draft for review</p>
        <span className="text-xs text-neutral-500">
          Confidence: {Number(workOrder.draft_confidence ?? 0).toFixed(2)}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap bg-neutral-50 border border-neutral-100 rounded p-3">
        {workOrder.draft_content}
      </p>
      {workOrder.draft_source && (
        <p className="text-xs text-neutral-400">Reference: {workOrder.draft_source}</p>
      )}
      <button
        disabled={isPending}
        onClick={() => {
          if (!confirm(`Approve and issue ${woNumber}? This will generate the PDF and mark it as issued.`)) return;
          const fd = new FormData();
          fd.set("id", workOrder.id);
          startTransition(async () => {
            await approveWorkOrder(fd);
          });
        }}
        className="bg-neutral-900 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
      >
        {isPending ? "Approving…" : "Approve & Issue"}
      </button>
    </div>
  );
}
