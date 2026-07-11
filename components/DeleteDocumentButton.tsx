"use client";

import { deleteDocument } from "@/app/documents/actions";

export function DeleteDocumentButton({ id, storagePath }: { id: string; storagePath: string }) {
  return (
    <button
      className="text-red-600 underline text-sm"
      onClick={() => {
        if (!confirm("Delete this document from the knowledgebase?")) return;
        const fd = new FormData();
        fd.set("id", id);
        fd.set("storage_path", storagePath);
        deleteDocument(fd);
      }}
    >
      Delete
    </button>
  );
}
