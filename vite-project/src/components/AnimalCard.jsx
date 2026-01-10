import { MapPin, Syringe, Heart } from "lucide-react";

export default function AnimalCard({ item, onDonate }) {
  const isDonate = item.category === "donate";

  return (
    <div
      className="card rounded-[2rem] overflow-hidden transition-all
                 border border-pink-200
                 hover:border-pink-400
                 hover:ring-2 hover:ring-pink-300/40
                 group"
    >
      {/* IMAGE HEADER */}
      <div className="relative h-48 w-full overflow-hidden border-b border-pink-200">
        {item.imageUrl ? (
          <>
            {/* Image */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="absolute inset-0 h-full w-full object-cover object-center
                         transition-all duration-300
                         group-hover:contrast-110 group-hover:saturate-110"
            />

            {/* Soft pastel overlay (fades on hover to show real colors) */}
            <div
              className="absolute inset-0 bg-gradient-to-br
                         from-pink-100/40 via-rose-50/20 to-cyan-50/30
                         transition-opacity duration-300
                         group-hover:opacity-0"
            />

            {/* Decorative blobs (very subtle) */}
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-pink-200/40 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-2xl" />
            </div>
          </>
        ) : (
          /* Fallback when no image exists */
          <div className="h-full w-full flex items-center justify-center
                          bg-gradient-to-br from-pink-100 via-rose-50 to-cyan-50
                          text-zinc-500 font-semibold">
            No image available 🐾
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black">{item.name}</h3>
            <p className="text-sm text-zinc-600">
              {item.breed} • {item.gender} • {item.age}
            </p>
          </div>

          <span className="text-xs font-extrabold px-2 py-1 rounded-full
                           bg-pink-100/70 text-pink-700 border border-pink-200">
            {isDonate ? "Donate" : "Adopt"}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-zinc-700">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-pink-500" />
            <span>{item.shelter}</span>
          </div>

          {isDonate ? (
            <div className="flex items-start gap-2">
              <Syringe size={16} className="mt-0.5 text-pink-500" />
              <span>{item.medicalNeeds}</span>
            </div>
          ) : (
            <p className="text-zinc-700">{item.about}</p>
          )}
        </div>

        {isDonate ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Progress</span>
              <span className="font-extrabold text-pink-700">
                ₱{item.raised.toLocaleString()}/₱{item.goal.toLocaleString()}
              </span>
            </div>

            <div className="mt-2 h-3 rounded-full bg-pink-100 overflow-hidden border border-pink-200">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, (item.raised / item.goal) * 100)}%`,
                  background:
                    "linear-gradient(135deg, rgb(var(--pink)), rgb(var(--pink2)))",
                }}
              />
            </div>

            <button
              onClick={() => onDonate(item)}
              className="mt-4 w-full btn-pink rounded-2xl px-4 py-3
                         font-extrabold transition-all
                         shadow-[0_14px_35px_rgba(236,72,153,.22)]"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Heart size={18} /> Donate
              </span>
            </button>
          </div>
        ) : (
          <a
            href={item.fbLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 block text-center btn-soft rounded-2xl px-4 py-3
                       font-extrabold text-pink-700 transition-all"
          >
            Adopt (Message on Facebook)
          </a>
        )}
      </div>
    </div>
  );
}
