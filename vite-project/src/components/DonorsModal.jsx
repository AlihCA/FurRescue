import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export default function DonorsModal({ open, onClose, animal }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [donations, setDonations] = useState([]);

  const animalId = animal?.id;

  useEffect(() => {
    if (!open || !animalId) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setDonations([]);

        const res = await fetch(
          `http://localhost:4000/api/animals/${animalId}/donations`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          let msg = "Failed to load donations";
          try {
            const j = await res.json();
            msg = j?.error || msg;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        setDonations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Error loading donations");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [open, animalId]);

  const total = useMemo(() => {
    return donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }, [donations]);

  if (!open || !animal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-zinc-200 shadow-xl p-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl hover:bg-zinc-100"
          aria-label="Close"
          type="button"
        >
          <X />
        </button>

        <h2 className="text-xl font-extrabold">
          Donations for: {animal.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Transparency list of donors and amounts (paid donations only).
        </p>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">Total donated</p>
            <p className="text-lg font-black text-zinc-900">
              ₱{total.toLocaleString()}
            </p>
          </div>

          {animal.goal ? (
            <p className="mt-1 text-xs text-zinc-600">
              Goal: ₱{Number(animal.goal).toLocaleString()}
            </p>
          ) : null}
        </div>

        {loading && <p className="mt-4 text-zinc-600">Loading...</p>}
        {err && <p className="mt-4 text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="mt-4">
            {donations.length === 0 ? (
              <p className="text-zinc-600">No donations yet.</p>
            ) : (
              <div className="space-y-3">
                {donations.map((d) => {
                  const when = d.createdAt
                    ? new Date(d.createdAt).toLocaleString()
                    : "";
                  return (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-zinc-900">
                            {d.donorName || "Anonymous"}
                          </p>
                          {when ? (
                            <p className="text-xs text-zinc-500 mt-1">{when}</p>
                          ) : null}
                        </div>

                        <p className="font-black text-zinc-900">
                          ₱{Number(d.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-soft rounded-2xl px-5 py-3 font-extrabold text-pink-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
