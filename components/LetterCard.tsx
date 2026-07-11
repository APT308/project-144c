"use client";

import { useState, useTransition } from "react";
import { approveLetter, markLetterSent } from "@/app/letters/actions";

type Letter = {
  id: string;
  issue_description: string | null;
  recipient_party: string | null;
  draft_content: string | null;
  draft_source: string | null;
  draft_confidence: number | null;
  draft_review_status: string | null;
  sent_at: string | null;
};

export function LetterCard({ letter }: { letter: Letter }) {
  const [content, setContent] = useState(letter.draft_content ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="font-medium">{letter.issue_description}</p>
          <p className="text-xs text-neutral-500">To: {letter.recipient_party}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Confidence: {Number(letter.draft_confidence ?? 0).toFixed(2)}</span>
          {letter.draft_review_status === "approved" && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Approved</span>
          )}
          {letter.sent_at && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Sent</span>}
        </div>
      </div>

      {letter.draft_review_status === "approved" ? (
        <p className="text-sm whitespace-pre-wrap bg-neutral-50 border border-neutral-100 rounded p-3">
          {letter.draft_content}
        </p>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full text-sm border rounded p-3 whitespace-pre-wrap"
        />
      )}

      {letter.draft_source && <p className="text-xs text-neutral-400">Reference: {letter.draft_source}</p>}

      <div className="flex gap-2">
        {letter.draft_review_status !== "approved" && (
          <button
            disabled={isPending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", letter.id);
              fd.set("draft_content", content);
              startTransition(async () => {
                await approveLetter(fd);
              });
            }}
            className="bg-neutral-900 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {isPending ? "Approving…" : "Approve"}
          </button>
        )}
        {letter.draft_review_status === "approved" && !letter.sent_at && (
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm("Mark this letter as sent? This cannot be undone.")) return;
              const fd = new FormData();
              fd.set("id", letter.id);
              startTransition(async () => {
                await markLetterSent(fd);
              });
            }}
            className="bg-neutral-900 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Mark as Sent"}
          </button>
        )}
      </div>
    </div>
  );
}
