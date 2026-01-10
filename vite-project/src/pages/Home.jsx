import { useNavigate } from "react-router-dom";
import { HeartHandshake, Sparkles, PawPrint } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="py-14 grid md:grid-cols-2 gap-10 items-center">
        <div className="card rounded-[2rem] overflow-hidden">
          <div className="h-[320px] md:h-[420px] relative bg-gradient-to-br from-pink-100 via-rose-50 to-cyan-50">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute -top-10 -left-10 h-44 w-44 rounded-full bg-pink-200/60 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-cyan-200/60 blur-2xl" />
            </div>

            <div
               className="relative h-full flex flex-col items-center justify-center text-center px-8
             bg-no-repeat bg-center"

              style={{
                backgroundImage: `url(${import.meta.env.BASE_URL}hero-bg.jpg)`,
                backgroundSize: "cover",
              }}
            >
                    
            </div>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-pink-600 bg-pink-100/70 px-3 py-2 rounded-full border border-pink-200">
            <Sparkles size={16} />
            Every paw matters
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Save <span className="text-pink-600"> Fur Lives </span> Together
          </h1>

          <p className="mt-4 text-zinc-700 leading-relaxed">
            FurRescue is a blog + rescue hub where you can support animals under medical care
            and adopt fully recovered dogs ready for their forever family.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/animals?tab=donate")}
              className="btn-pink rounded-2xl px-5 py-3 font-extrabold transition-all shadow-[0_14px_35px_rgba(236,72,153,.22)]"
            >
              <span className="inline-flex items-center gap-2">
                <HeartHandshake size={18} /> Donate
              </span>
            </button>

            <button
              onClick={() => navigate("/animals?tab=adopt")}
              className="btn-soft rounded-2xl px-5 py-3 font-extrabold text-pink-700 transition-all"
            >
              Adopt
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}
