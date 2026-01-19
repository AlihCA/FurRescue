import { NavLink, useLocation } from "react-router-dom";
import { PawPrint, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import AdminNotifications from "./AdminNotifications";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const authSize = "px-4 py-2 rounded-2xl text-sm font-semibold";

  const { user, isSignedIn } = useUser();
  const isAdmin = isSignedIn && user?.publicMetadata?.role === "admin";

  const location = useLocation();
  const panelRef = useRef(null);

  const base = "px-3 py-2 rounded-2xl text-sm font-semibold transition-all";
  const inactive = "text-zinc-700 hover:bg-pink-100/60";
  const active = "text-pink-700 bg-pink-100/80 border border-pink-200";

  const links = [
    { to: "/", label: "Home" },
    { to: "/animals", label: "Animals" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  // ✅ Close menu on route change (back/forward too)
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ✅ Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ✅ Close on ESC + outside click
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onDown = (e) => {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-pink-200">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className="flex items-center gap-2"
              aria-label="Go to homepage"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl btn-pink">
                <PawPrint size={18} />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                Fur<span className="text-pink-600">Rescue</span>
              </span>
            </NavLink>

            {/* Desktop links */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `${base} ${isActive ? active : inactive}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `${base} ${isActive ? active : inactive}`
                  }
                >
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            <SignedOut>
              <NavLink
                to="/sign-in"
                className={({ isActive }) =>
                  `${authSize} ${isActive ? active : inactive}`
                }
              >
                Sign in
              </NavLink>

              <NavLink
                to="/sign-up"
                className={`btn-pink ${authSize} font-extrabold transition-all`}
              >
                Sign up
              </NavLink>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-2">
                {isAdmin && <AdminNotifications />}
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-2xl hover:bg-pink-100/60 transition"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* ✅ Mobile overlay + panel */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* panel */}
          <div
            ref={panelRef}
            className="absolute top-0 left-0 right-0 mt-16
                       bg-white border-t border-pink-200
                       px-4 py-4 space-y-2 shadow-xl"
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `block w-full ${base} ${isActive ? active : inactive}`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `block w-full ${base} ${isActive ? active : inactive}`
                }
              >
                Admin
              </NavLink>
            )}

            {/* Mobile admin notifications */}
            {isAdmin && (
              <div className="pt-2">
                <p className="text-xs font-extrabold text-zinc-600 mb-2">
                  Admin
                </p>
                <AdminNotifications />
              </div>
            )}

            <div className="pt-3 border-t border-pink-200/60 space-y-2">
              <SignedOut>
                <NavLink
                  to="/sign-in"
                  className={`block w-full ${base} ${inactive}`}
                >
                  Sign in
                </NavLink>

                <NavLink
                  to="/sign-up"
                  className="block w-full btn-pink rounded-2xl px-4 py-2 text-sm font-extrabold transition-all text-center"
                >
                  Sign up
                </NavLink>
              </SignedOut>

              <SignedIn>
                <div className="px-2 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
