import { useEffect, useMemo, useState } from "react";
import { X, UploadCloud } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { createPortal } from "react-dom";

export default function ProofUploadModal({ open, onClose, animalId, animalName, onUploaded }) {
  const { getToken } = useAuth();
  const API = import.meta.env.VITE_API_URL;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview("");
    setErr("");
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const title = useMemo(() => {
    if (!animalId) return "Upload Receipt";
    return `Upload Receipt ${animalName ? `for ${animalName}` : `for Animal #${animalId}`}`;
  }, [animalId, animalName]);

  const submit = async () => {
    if (!animalId) return;
    if (!file) return setErr("Please choose an image file.");

    try {
      setLoading(true);
      setErr("");

      const token = await getToken();

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API}/api/admin/animals/${animalId}/receipt/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      onUploaded?.(data); // updated animal
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div
        className="relative w-[520px] max-w-[92vw] max-h-[85vh]
                  rounded-3xl bg-white shadow-xl border border-zinc-200
                  overflow-hidden flex flex-col"
      >

        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <p className="font-extrabold">{title}</p>
            <p className="text-xs text-zinc-600">
              Upload vet receipt / proof of expenses for transparency.
            </p>
          </div>
          <button
            className="p-2 rounded-xl hover:bg-zinc-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

          <div className="rounded-2xl border border-zinc-200 p-4">
            <label className="text-sm font-semibold">Receipt image *</label>
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {preview && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-200">
                <img src={preview} alt="Receipt preview" className="w-full h-auto" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-2xl px-4 py-2 font-extrabold border border-zinc-200 hover:bg-zinc-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-pink rounded-2xl px-4 py-2 font-extrabold inline-flex items-center gap-2 disabled:opacity-50"
              onClick={submit}
              disabled={loading}
            >
              <UploadCloud size={18} />
              {loading ? "Uploading..." : "Upload & Finalize"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

}
