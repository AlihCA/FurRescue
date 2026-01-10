import { useEffect, useMemo, useState } from "react";
import { X, QrCode } from "lucide-react";

export default function DonateModal({ open, onClose, animal, onSuccess }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setShowQR(false);
    }
  }, [open]);

  const maxAmount = useMemo(() => {
    if (!animal) return 0;
    return Math.max(0, animal.goal - animal.raised);
  }, [animal]);

  if (!open || !animal) return null;

  const amtNum = Number(amount);
  const validAmount = Number.isFinite(amtNum) && amtNum > 0 && amtNum <= maxAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-zinc-200 shadow-xl p-6
                max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl hover:bg-zinc-100"
          aria-label="Close"
        >
          <X />
        </button>

        <h2 className="text-xl font-extrabold">Donate to {animal.name}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Remaining needed: <span className="font-semibold">₱{maxAmount.toLocaleString()}</span>
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-semibold">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/20"
              placeholder="Enter your name or a nickname."
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Amount (PHP)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/20"
              placeholder={`Max ₱${maxAmount.toLocaleString()}`}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Only accepts up to the remaining needed amount.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setShowQR(true)}
            disabled={!validAmount || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white px-4 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition"
          >
            <QrCode size={18} />
            Generate GCash QR 
          </button>

          <button
            onClick={() => {
              if (!validAmount || !name.trim()) return;
              onSuccess({ name: name.trim(), amount: amtNum });
            }}
            disabled={!validAmount || !name.trim()}
            className="rounded-xl border border-zinc-300 px-4 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition"
          >
            Done
          </button>
        </div>

        {showQR && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold">Mock GCash QR</p>
            <p className="text-sm text-zinc-600 mt-1">
              Amount to pay: <span className="font-bold">₱{amtNum.toLocaleString()}</span>
            </p>

            <div className="mt-4 w-full rounded-2xl border border-zinc-200 bg-white p-4 flex justify-center">
              <img
                src={`${import.meta.env.BASE_URL}gcash-qr.jpg`}
                alt="QR"
                className="block max-w-full h-auto"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
