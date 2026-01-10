import { NavLink } from "react-router-dom";
import { PawPrint, Heart, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const base =
    "px-3 py-2 rounded-2xl text-sm font-semibold transition-all";
  const inactive =
    "text-zinc-700 hover:bg-pink-100/60";
  const active =
    "text-pink-700 bg-pink-100/80 border border-pink-200";

  const links = [
    { to: "/", label: "Home" },
    { to: "/animals", label: "Animals" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-pink-200">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between">
          <NavLink
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl btn-pink">
              <PawPrint size={18} />
            </span>

            <span className="text-lg font-extrabold tracking-tight">
              Fur<span className="text-pink-600">Rescue</span>
            </span>

            <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-xs font-bold text-pink-600 bg-pink-100/70 px-2 py-1 rounded-full border border-pink-200">
              <Heart size={14} /> Donate & Adopt
            </span>
          </NavLink>

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
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-2xl hover:bg-pink-100/60 transition"
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300
          ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-white border-t border-pink-200 px-4 py-4 space-y-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full ${base} ${
                  isActive ? active : inactive
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
