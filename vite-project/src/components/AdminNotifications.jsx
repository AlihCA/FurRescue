import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import ProofUploadModal from "./ProofUploadModal";

export default function AdminNotifications() {
  const { getToken } = useAuth();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [proofOpen, setProofOpen] = useState(false);
  const [selected, setSelected] = useState(null); // notification object

  const API = import.meta.env.VITE_API_URL;

  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items]
  );

  const rootRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const token = await getToken();
      const res = await fetch(`${API}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load notifications");

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Error loading notifications");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to mark as read");

      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  // Optional: mark all read (frontend-only UX if you don't have an endpoint)
  const markAllReadLocal = () => {
    setItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
    );
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on click outside + ESC
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Icon button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-2xl inline-flex items-center justify-center
                   border border-pink-200 bg-white hover:bg-pink-50 transition"
        aria-label="Admin notifications"
      >
        <Bell size={18} className="text-pink-700" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                       rounded-full bg-pink-600 text-white text-[10px] font-black
                       inline-flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999]" role="dialog" aria-label="Admin notifications panel">
            {/* click outside */}
            <div className="absolute inset-0" onClick={() => setOpen(false)} />

            {/* panel */}
            <div
              className="absolute right-4 top-[72px] w-[360px] max-w-[92vw]
                        rounded-3xl border border-zinc-200 bg-white shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-200 flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">Notifications</p>
                  <p className="text-xs text-zinc-600">Goal reached alerts (latest 100).</p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-zinc-100"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 max-h-[380px] overflow-y-auto">
                {loading && <p className="text-zinc-600">Loading...</p>}
                {err && <p className="text-red-600">{err}</p>}

                {!loading && !err && items.length === 0 && (
                  <p className="text-zinc-600">No notifications yet.</p>
                )}

                {!loading && !err && items.length > 0 && (
                  <div className="space-y-3">
                    {items.map((n) => {
                      const when = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
                      const unread = !n.readAt;
                      const animalId = n.animalId;
                      const canUpload = n.type === "GOAL_REACHED" && animalId;

                      return (
                        <div
                          key={n.id}
                          className={`rounded-2xl border p-4 ${
                            unread ? "border-pink-200 bg-pink-50/40" : "border-zinc-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-zinc-900">{n.type || "NOTIFICATION"}</p>
                              <p className="text-sm text-zinc-700 mt-1">{n.message}</p>
                              {when && <p className="text-xs text-zinc-500 mt-2">{when}</p>}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {unread ? (
                                <button
                                  type="button"
                                  onClick={() => markRead(n.id)}
                                  className="rounded-2xl px-3 py-2 text-sm font-extrabold
                                            border border-pink-200 text-pink-700 hover:bg-pink-50
                                            inline-flex items-center gap-2 transition"
                                >
                                  <Check size={16} />
                                  Read
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-zinc-500">Read</span>
                              )}

                              {canUpload && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelected(n);
                                    setProofOpen(true);
                                    setOpen(false);
                                  }}
                                  className="rounded-2xl px-3 py-2 text-sm font-extrabold
                                            border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition"
                                >
                                  Upload Receipt
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={markAllReadLocal}
                  className="text-sm font-extrabold text-zinc-700 hover:text-zinc-900"
                >
                  Mark all as read
                </button>

                <button
                  type="button"
                  onClick={load}
                  className="rounded-2xl px-4 py-2 font-extrabold border border-pink-200 text-pink-700 hover:bg-pink-50 transition"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}


      <ProofUploadModal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        animalId={selected?.animalId}
        animalName={null}
        onUploaded={async () => {
          // Refresh notifications list (optional)
          await load();

          // Mark this notification as read automatically
          if (selected?.id) {
            await markRead(selected.id);
          }
        }}
      />

    </div>
  );
}
