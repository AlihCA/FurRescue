import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Tabs from "../components/Tabs";
import AnimalCard from "../components/AnimalCard";
import DonateModal from "../components/DonateModal";
import DonorsModal from "../components/DonorsModal";
import { HandHeart } from "lucide-react";

import { useAuth } from "@clerk/clerk-react";

export default function Animals() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") === "adopt" ? "adopt" : "donate";
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

  // Keep URL in sync with tab
  useEffect(() => {
    setParams({ tab });
  }, [tab, setParams]);

  // Load animals once
  const loadAnimals = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:4000/api/animals");
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

  const filtered = useMemo(
    () => items.filter((a) => a.category === tab),
    [items, tab]
  );

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
        `http://localhost:4000/api/animals/${animal.id}/donations`
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
        `http://localhost:4000/api/animals/${selected.id}/paymongo/checkout`,
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
          ]}
        />
      </div>

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
