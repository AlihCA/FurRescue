import { NavLink } from "react-router-dom";
import { PawPrint, Menu, X } from "lucide-react";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const authSize = "px-4 py-2 rounded-2xl text-sm font-semibold";

  const { user, isSignedIn } = useUser();
  const isAdmin = isSignedIn && user?.publicMetadata?.role === "admin";

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

          <div className="flex items-center gap-4">
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
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-2xl hover:bg-pink-100/60 transition"
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-t border-pink-200 px-4 py-4 space-y-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full ${base} ${isActive ? active : inactive}`
              }
            >
              {l.label}
            </NavLink>
          ))}

          {/* Admin link (mobile) */}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block w-full ${base} ${isActive ? active : inactive}`
              }
            >
              Admin
            </NavLink>
          )}

          {/* Mobile auth */}
          <div className="pt-3 border-t border-pink-200/60">
            <SignedOut>
              <NavLink
                to="/sign-in"
                onClick={() => setOpen(false)}
                className={`block w-full ${base} ${inactive}`}
              >
                Sign in
              </NavLink>

              <NavLink
                to="/sign-up"
                onClick={() => setOpen(false)}
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

    </header>
  );
}
