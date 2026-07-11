"use client";

import { useState } from "react";
import { overrideRecommendation, deleteQuotation } from "@/app/quotations/actions";

type QuoteRow = {
  fileName: string;
  totalPrice: number;
  lineItems: { description: string; amount: number }[];
  missingTerms: string[];
};

type Quotation = {
  id: string;
  description: string | null;
  comparison_output: { quotes: QuoteRow[]; commonTerms: string[] } | null;
  comparison_confidence: number | null;
  comparison_review_status: string | null;
  recommendation: string | null;
  recommendation_source: string | null;
  recommendation_confidence: number | null;
  recommendation_review_status: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(amount);
}

export function QuotationCard({ quotation }: { quotation: Quotation }) {
  const [editing, setEditing] = useState(false);
  const quotes = quotation.comparison_output?.quotes ?? [];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{quotation.description || "Quotation comparison"}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Confidence: {Number(quotation.comparison_confidence ?? 0).toFixed(2)}
            {quotation.comparison_review_status === "needs_review" && (
              <span className="ml-2 text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Needs Review</span>
            )}
          </p>
        </div>
        <button
          className="text-red-600 underline text-sm"
          onClick={() => {
            if (!confirm("Delete this quotation comparison?")) return;
            const fd = new FormData();
            fd.set("id", quotation.id);
            deleteQuotation(fd);
          }}
        >
          Delete
        </button>
      </div>

      {quotes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead>
              <tr className="text-xs uppercase text-neutral-500">
                <th className="p-2">Quote</th>
                <th className="p-2">Total price</th>
                <th className="p-2">Line items</th>
                <th className="p-2">Missing terms</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.fileName} className="border-t border-neutral-100">
                  <td className="p-2 font-medium">{q.fileName}</td>
                  <td className="p-2">{formatCurrency(q.totalPrice)}</td>
                  <td className="p-2 text-neutral-500">{q.lineItems.length}</td>
                  <td className="p-2">
                    {q.missingTerms.length === 0 ? (
                      <span className="text-neutral-400">none</span>
                    ) : (
                      <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {q.missingTerms.length} missing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium">Recommendation</p>
          {quotation.recommendation_review_status === "needs_review" && (
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Needs Review</span>
          )}
          {quotation.recommendation_review_status === "overridden" && (
            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Manually Overridden</span>
          )}
        </div>
        {editing ? (
          <form
            action={async (fd) => {
              await overrideRecommendation(fd);
              setEditing(false);
            }}
            className="space-y-2"
          >
            <input type="hidden" name="id" value={quotation.id} />
            <textarea
              name="recommendation"
              defaultValue={quotation.recommendation ?? ""}
              rows={3}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-neutral-900 text-white px-3 py-1 rounded text-sm">
                Save override
              </button>
              <button type="button" onClick={() => setEditing(false)} className="border px-3 py-1 rounded text-sm">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm whitespace-pre-wrap">{quotation.recommendation}</p>
            <button onClick={() => setEditing(true)} className="text-xs underline mt-1">
              Override recommendation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
