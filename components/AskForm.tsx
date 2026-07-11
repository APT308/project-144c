"use client";

import { useRef, useTransition } from "react";

export function AskForm({
  action,
  projectId,
}: {
  action: (formData: FormData) => Promise<void>;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        startTransition(async () => {
          await action(fd);
          formRef.current?.reset();
        });
      }}
      className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <textarea
        name="question"
        required
        rows={2}
        placeholder="e.g. What is the notice period for extension of time?"
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
      >
        {isPending ? "Asking…" : "Ask"}
      </button>
    </form>
  );
}
