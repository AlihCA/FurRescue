import { PawPrint, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-pink-200 mt-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl btn-pink">
              <PawPrint size={18} />
            </span>

            <span className="text-sm text-zinc-600">
              © {new Date().getFullYear()}{" "}
              <span className="font-extrabold text-zinc-800">
                Fur<span className="text-pink-600">Rescue</span>
              </span>
            </span>
          </div>

          {/* Center: Tagline */}
          <div className="flex items-center gap-2 text-sm font-semibold text-pink-700 bg-pink-100/70 px-3 py-2 rounded-full border border-pink-200">
            <Heart size={14} />
            Every paw matters, and every act of kindness counts
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/animals"
              className="text-zinc-600 hover:text-pink-700 transition"
            >
              Animals
            </Link>
            <Link
              to="/about"
              className="text-zinc-600 hover:text-pink-700 transition"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-zinc-600 hover:text-pink-700 transition"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
