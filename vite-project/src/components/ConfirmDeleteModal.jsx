import { X, Trash2 } from "lucide-react";

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Delete item?",
  description = "This action cannot be undone.",
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-white border border-zinc-200 shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl hover:bg-zinc-100"
          aria-label="Close"
          type="button"
        >
          <X />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <Trash2 className="text-red-600" />
          </div>

          <div>
            <h2 className="text-lg font-extrabold">{title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-soft rounded-2xl px-5 py-3 font-extrabold text-pink-700 transition-all"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl px-5 py-3 font-extrabold transition-all text-white
                       bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                       inline-flex items-center gap-2"
          >
            <Trash2 size={18} />
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
