import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Tabs from "../components/Tabs";
import AnimalCard from "../components/AnimalCard";
import DonateModal from "../components/DonateModal";
import DonorsModal from "../components/DonorsModal";
import { HandHeart, Search, X } from "lucide-react";

import { useAuth } from "@clerk/clerk-react";

export default function Animals() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") === "adopt" ? "adopt" : "donate";
  const refresh = params.get("refresh");
  const [tab, setTab] = useState(initialTab);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Donors modal state
  const [donorsOpen, setDonorsOpen] = useState(false);
  const [donorsAnimal, setDonorsAnimal] = useState(null);
  const [donors, setDonors] = useState([]);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorsError, setDonorsError] = useState("");

  const [receiptFilter, setReceiptFilter] = useState("all"); 
  const [sortMode, setSortMode] = useState("pending_first");
  const [q, setQ] = useState("");

  useEffect(() => {
    setQ("");
  }, [tab]);

  useEffect(() => {
    if (refresh === "1") {
      loadAnimals();
      const next = new URLSearchParams(params);
      next.delete("refresh");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);


  // Keep URL in sync with tab
  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);


  // Load animals once
  const loadAnimals = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/animals`);
      if (!res.ok) throw new Error("Failed to load animals");

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Error loading animals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  const filtered = useMemo(() => {
  const isGoalReached = (a) => {
    const g = Number(a.goal || 0);
    const r = Number(a.raised || 0);
    return a.category === "donate" && Number.isFinite(g) && g > 0 && r >= g;
  };

  let base = [];
  if (tab === "donate") {
    // Donate tab = donate animals NOT yet reached
    base = items.filter((a) => a.category === "donate" && !isGoalReached(a));
  } else if (tab === "adopt") {
    base = items.filter((a) => a.category === "adopt");
  } else if (tab === "goal") {
    // Goal tab = ONLY reached donation animals
    base = items.filter((a) => isGoalReached(a));

    // optional receipt filter (only applies in goal tab)
    if (receiptFilter === "pending") base = base.filter((a) => !a.receiptUrl);
    if (receiptFilter === "uploaded") base = base.filter((a) => Boolean(a.receiptUrl));
  } else {
    base = items;
  }

  // search filter (applies to ALL tabs)
  const s = q.trim().toLowerCase();
  if (s) {
    base = base.filter((a) => {
      const hay = [
        a.name,
        a.breed,
        a.shelter,
        a.medicalNeeds,
        a.about,
        a.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }

  // sorting
  const copy = [...base];

  // If you only want special sorting on goal tab:
  if (tab === "goal") {
    if (sortMode === "pending_first") {
      copy.sort(
        (a, b) => Number(Boolean(a.receiptUrl)) - Number(Boolean(b.receiptUrl))
      );
    } else if (sortMode === "uploaded_first") {
      copy.sort(
        (a, b) => Number(Boolean(b.receiptUrl)) - Number(Boolean(a.receiptUrl))
      );
    } else if (sortMode === "newest") {
      copy.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }

  return copy;
  }, [items, tab, q, receiptFilter, sortMode]);


  const openDonate = (animal) => {
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    setSelected(animal);
    setModalOpen(true);
  };

  // Open donors modal (click progress)
  const openDonors = async (animal) => {
    setDonorsAnimal(animal);
    setDonorsOpen(true);

    try {
      setDonorsLoading(true);
      setDonorsError("");

      const res = await fetch(
        `${API}/api/animals/${animal.id}/donations`
      );
      if (!res.ok) throw new Error("Failed to load donors");

      const data = await res.json();
      setDonors(Array.isArray(data) ? data : []);
    } catch (e) {
      setDonorsError(e?.message || "Error loading donors");
      setDonors([]);
    } finally {
      setDonorsLoading(false);
    }
  };

  const handleSuccess = async ({ amount, donorName, isAnonymous }) => {
    try {
      const token = await getToken();

      const res = await fetch(
        `${API}/api/animals/${selected.id}/paymongo/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, donorName, isAnonymous }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to start checkout");
      }

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl; // redirect to PayMongo
    } catch (e) {
      alert(e?.message || "Donation failed");
    }
  };


  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Animals</h1>
          <p className="mt-2 text-zinc-600">
            Donate to medical needs or adopt recovered pets ready for a home.
          </p>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "donate", label: "Donate" },
            { value: "adopt", label: "Adopt" },
            { value: "goal", label: "Goal Reached" },
          ]}
        />
      </div>

      {/* SEARCH BAR */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative w-full">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              tab === "adopt"
                ? "Search donate animals (name, breed, shelter)"
                : "Search adopt animals (name, breed, shelter, medical needs)"
            }
            className="w-full rounded-2xl border border-zinc-200
                      pl-11 pr-10 py-3 text-sm
                      outline-none transition
                      focus:ring-2 focus:ring-pink-300/40
                      focus:border-pink-300"
          />

          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2
                        rounded-full p-1 hover:bg-zinc-100"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

        {tab === "goal" && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div>
              <label className="text-xs font-extrabold text-zinc-600">Receipt </label>
              <select
                value={receiptFilter}
                onChange={(e) => setReceiptFilter(e.target.value)}
                className="mt-1 w-full sm:w-[220px] rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending receipt</option>
                <option value="uploaded">Receipt uploaded</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-zinc-600">Sort </label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="mt-1 w-full sm:w-[220px] rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="pending_first">Pending first</option>
                <option value="uploaded_first">Uploaded first</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        )}

      {!loading && filtered.length === 0 && (
        <p className="mt-6 text-zinc-500 text-sm">
          No animals match your search.
        </p>
      )}

      {loading && <p className="mt-6 text-zinc-600">Loading animals...</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((a) => (
          <AnimalCard
            key={a.id}
            item={a}
            onDonate={openDonate}
            onViewDonors={openDonors}
          />
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
            <HandHeart />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">
              Donate for general rescue needs
            </h2>
            <p className="mt-1 text-zinc-600">
              Support food, shelter supplies, transportation, and emergency rescues.
            </p>
            <button
              onClick={() => alert("UI palang, next time na to")}
              className="mt-4 rounded-xl bg-zinc-900 text-white px-5 py-3 font-semibold hover:bg-zinc-800 transition"
            >
              Donate (General)
            </button>
          </div>
        </div>
      </section>

      <DonateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        animal={selected}
        onSuccess={handleSuccess}
      />

      <DonorsModal
        open={donorsOpen}
        onClose={() => {
          setDonorsOpen(false);
          setDonorsAnimal(null);
          setDonors([]);
          setDonorsError("");
        }}
        animal={donorsAnimal}
        donors={donors}
        loading={donorsLoading}
        error={donorsError}
      />
    </main>
  );
}
