import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/data/project";
import { uploadDocument, getDocumentDownloadUrl } from "./actions";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";

const DOC_TYPES = ["conditions_of_contract", "BOQ", "drawings", "other"];

export default async function DocumentsPage() {
  const project = await getCurrentProject();
  if (!project) return <p>No project found.</p>;

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("contract_documents")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const rows = await Promise.all(
    (documents ?? []).map(async (doc) => ({
      ...doc,
      downloadUrl: doc.storage_path ? await getDocumentDownloadUrl(doc.storage_path) : null,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Contract Documents</h1>
        <p className="text-sm text-neutral-500">
          Upload conditions of contract, BOQ, and drawings. Text is extracted for the
          contractual advice knowledgebase.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium mb-3">Upload document</h2>
        <form action={uploadDocument} className="flex flex-wrap gap-2 items-center">
          <input type="hidden" name="project_id" value={project.id} />
          <select name="doc_type" required className="border rounded px-2 py-1.5 text-sm">
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="text-sm"
          />
          <button type="submit" className="bg-neutral-900 text-white px-3 py-1.5 rounded text-sm">
            Upload
          </button>
        </form>
        <p className="text-xs text-neutral-400 mt-2">Only PDF files are accepted.</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="text-xs uppercase text-neutral-500">
              <th className="p-3">Type</th>
              <th className="p-3">File</th>
              <th className="p-3">Extracted text</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-500">
                  No documents uploaded yet — upload the first one above.
                </td>
              </tr>
            )}
            {rows.map((doc) => (
              <tr key={doc.id} className="border-t border-neutral-200">
                <td className="p-3 text-sm">{doc.doc_type}</td>
                <td className="p-3 text-sm">
                  {doc.downloadUrl ? (
                    <a href={doc.downloadUrl} className="underline" target="_blank">
                      {doc.file_name}
                    </a>
                  ) : (
                    doc.file_name
                  )}
                </td>
                <td className="p-3 text-sm text-neutral-500 max-w-xs truncate">
                  {doc.parsed_text ? `${doc.parsed_text.slice(0, 80)}…` : "—"}
                </td>
                <td className="p-3 text-sm">
                  <DeleteDocumentButton id={doc.id} storagePath={doc.storage_path ?? ""} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
