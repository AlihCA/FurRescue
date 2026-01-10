import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Animals from "./pages/Animals";
import About from "./pages/About";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <div className="paw-bg min-h-screen">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="mt-16 bg-white border-t border-pink-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()}{" "}
              <span className="font-extrabold text-zinc-800">FurRescue</span>.
              Every paw matters, and every act of kindness counts
            </p>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-zinc-500">Donate • Adopt • Care</span>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
