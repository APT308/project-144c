"use client";

export function DeleteButton({
  id,
  action,
  confirmText = "Delete this row?",
  label = "Delete",
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  confirmText?: string;
  label?: string;
}) {
  return (
    <button
      className="text-red-600 underline text-sm"
      onClick={() => {
        if (!confirm(confirmText)) return;
        const fd = new FormData();
        fd.set("id", id);
        action(fd);
      }}
    >
      {label}
    </button>
  );
}
