// AnimalCard.jsx
import { MapPin, Syringe, Heart, Users } from "lucide-react";

export default function AnimalCard({ item, onDonate, onViewDonors }) {
  const isDonate = item.category === "donate";

  const raised = Number(item.raised || 0);
  const goal = Number(item.goal || 0);

  const hasGoal = isDonate && Number.isFinite(goal) && goal > 0;
  const progressPct = hasGoal ? Math.min(100, (raised / goal) * 100) : 0;

  const goalReached = hasGoal ? raised >= goal : false;

  const hasReceipt = Boolean(item.receiptUrl);
  const isFinalized = item.status === "finalized";

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
            <img
              src={item.imageUrl}
              alt={item.name}
              className="absolute inset-0 h-full w-full object-cover object-center
                         transition-all duration-300
                         group-hover:contrast-110 group-hover:saturate-110"
            />

            <div
              className="absolute inset-0 bg-gradient-to-br
                         from-pink-100/40 via-rose-50/20 to-cyan-50/30
                         transition-opacity duration-300
                         group-hover:opacity-0"
            />

            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-pink-200/40 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-2xl" />
            </div>
          </>
        ) : (
          <div
            className="h-full w-full flex items-center justify-center
                       bg-gradient-to-br from-pink-100 via-rose-50 to-cyan-50
                       text-zinc-500 font-semibold"
          >
            No image available
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black">{item.name}</h3>
            <p className="text-sm text-zinc-600">
              {item.breed} • {item.gender} • {item.age}
            </p>
          </div>

          <span
            className="text-xs font-extrabold px-2 py-1 rounded-full
                       bg-pink-100/70 text-pink-700 border border-pink-200"
          >
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
            {/* CLICKABLE PROGRESS (opens donors modal) */}
            <button
              type="button"
              onClick={() => onViewDonors?.(item)}
              className="w-full text-left rounded-2xl border border-pink-200 bg-pink-50/40 px-4 py-3
                         hover:bg-pink-50 transition
                         focus:outline-none focus:ring-2 focus:ring-pink-300/40"
              aria-label={`View donors for ${item.name}`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">
                  {goalReached ? "Goal Reached" : "Progress"}
                </span>

                <span className="font-extrabold text-pink-700">
                  {hasGoal ? (
                    <>
                      ₱{raised.toLocaleString()}/₱{goal.toLocaleString()}
                    </>
                  ) : (
                    <>₱{raised.toLocaleString()}</>
                  )}
                </span>
              </div>

              {hasGoal ? (
                <div className="mt-2 h-3 rounded-full bg-pink-100 overflow-hidden border border-pink-200">
                  <div
                    className="h-full"
                    style={{
                      width: `${progressPct}%`,
                      background:
                        "linear-gradient(135deg, rgb(var(--pink)), rgb(var(--pink2)))",
                    }}
                  />
                </div>
              ) : null}

              <div className="mt-2 text-xs text-zinc-600 inline-flex items-center gap-2">
                <Users size={14} className="text-pink-500" />
                Click to view donors list
              </div>
            </button>

            <button
              onClick={() => onDonate(item)}
              disabled={goalReached}
              className="mt-4 w-full btn-pink rounded-2xl px-4 py-3
                         font-extrabold transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Heart size={18} />
                {goalReached ? "Goal Reached" : "Donate"}
              </span>
            </button>

            {/* Receipt status / transparency */}
            {goalReached && !hasReceipt && (
              <div
                className="mt-3 block w-full text-center rounded-2xl px-4 py-3
                          font-extrabold border border-zinc-200 bg-zinc-50 text-zinc-700"
              >
                Receipt pending (for transparency)
              </div>
            )}

            {isFinalized && hasReceipt && (
              <a
                href={item.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block w-full text-center rounded-2xl px-4 py-3
                          font-extrabold border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition"
              >
                View Receipt (Transparency)
              </a>
            )}

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
