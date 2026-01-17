// src/components/DonateModal.jsx
import { useEffect, useMemo, useState } from "react";
import { X, Lock } from "lucide-react";

export default function DonateModal({ open, onClose, animal, onSuccess }) {
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setIsAnonymous(false);
      setAmount("");
      setSubmitting(false);
    }
  }, [open]);

  const maxAmount = useMemo(() => {
    if (!animal) return 0;
    return Math.max(0, Number(animal.goal || 0) - Number(animal.raised || 0));
  }, [animal]);

  if (!open || !animal) return null;

  const amtNum = Number(amount);
  const validAmount =
    Number.isFinite(amtNum) && amtNum > 0 && amtNum <= maxAmount;

  const validName = isAnonymous ? true : Boolean(name.trim());
  const canSubmit = validAmount && validName && !submitting;

  const proceed = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await onSuccess({
        donorName: isAnonymous ? "" : name.trim(),
        isAnonymous,
        amount: amtNum,
      });
      // NOTE: onSuccess will redirect to PayMongo, so we usually won't reach here.
    } finally {
      // If redirect fails for some reason, unlock the UI.
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={submitting ? undefined : onClose} />

      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-zinc-200 shadow-xl p-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-40"
          aria-label="Close"
          type="button"
        >
          <X />
        </button>

        <h2 className="text-xl font-extrabold">Donate to {animal.name}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Remaining needed:{" "}
          <span className="font-semibold">₱{maxAmount.toLocaleString()}</span>
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="anon"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => {
                const next = e.target.checked;
                setIsAnonymous(next);
                if (next) setName("");
              }}
              className="h-4 w-4"
              disabled={submitting}
            />
            <label htmlFor="anon" className="text-sm font-semibold">
              Donate as Anonymous
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Your name {isAnonymous ? "(optional)" : "*"}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAnonymous || submitting}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:bg-zinc-100"
              placeholder="Enter your name or a nickname."
            />
            {!isAnonymous && (
              <p className="mt-1 text-xs text-zinc-500">
                Required unless you choose Anonymous.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold">Amount (PHP) *</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              disabled={submitting}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:bg-zinc-100"
              placeholder={`Max ₱${maxAmount.toLocaleString()}`}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Only accepts up to the remaining needed amount.
            </p>

            {!validAmount && amount !== "" && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Enter a valid amount up to ₱{maxAmount.toLocaleString()}.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={proceed}
            disabled={!canSubmit}
            className="w-full btn-pink rounded-2xl px-4 py-3 font-extrabold transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            type="button"
          >
            <Lock size={18} />
            {submitting ? "Redirecting to payment..." : "Proceed to Payment"}
          </button>

          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full btn-soft rounded-2xl px-4 py-3 font-extrabold text-pink-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
          >
            Cancel
          </button>

          <p className="text-xs text-zinc-500 text-center">
            You’ll complete the donation securely via PayMongo (GCash/Card).
          </p>
        </div>
      </div>
    </div>
  );
}
