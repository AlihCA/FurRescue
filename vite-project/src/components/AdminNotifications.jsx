import { useEffect, useMemo, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

export default function AdminNotifications() {
  const { getToken } = useAuth();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items]
  );

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const token = await getToken();
      const res = await fetch("http://localhost:4000/api/admin/notifications", {
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
      const res = await fetch(
        `http://localhost:4000/api/admin/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to mark as read");

      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  useEffect(() => {
    // initial load
    load();

    // simple polling (every 20s)
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative btn-soft rounded-2xl px-4 py-2 font-extrabold text-pink-700 transition-all inline-flex items-center gap-2"
      >
        <Bell size={18} />
        Notifications
        {unreadCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-full text-xs font-black bg-pink-600 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-3xl border border-zinc-200 bg-white shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <p className="font-extrabold">Admin Notifications</p>
              <p className="text-xs text-zinc-600">
                Goal Reached alerts (latest 100).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl hover:bg-zinc-100"
              aria-label="Close notifications"
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
                  const when = n.createdAt
                    ? new Date(n.createdAt).toLocaleString()
                    : "";
                  const unread = !n.readAt;

                  return (
                    <div
                      key={n.id}
                      className={`rounded-2xl border p-4 ${
                        unread
                          ? "border-pink-200 bg-pink-50/40"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-zinc-900">
                            {n.type || "NOTIFICATION"}
                          </p>
                          <p className="text-sm text-zinc-700 mt-1">
                            {n.message}
                          </p>
                          {when && (
                            <p className="text-xs text-zinc-500 mt-2">{when}</p>
                          )}
                        </div>

                        {unread ? (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="btn-soft rounded-2xl px-3 py-2 font-extrabold text-pink-700 transition-all inline-flex items-center gap-2"
                          >
                            <Check size={16} />
                            Read
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-zinc-500">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-200 flex justify-end">
            <button
              type="button"
              onClick={load}
              className="btn-soft rounded-2xl px-4 py-2 font-extrabold text-pink-700 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
