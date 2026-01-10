import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Animals from "./pages/Animals";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="paw-bg min-h-screen flex flex-col">
      <Navbar />
        <main className="flex-1">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      <Footer />     
    </div>
  );
}
