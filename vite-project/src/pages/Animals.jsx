import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Tabs from "../components/Tabs";
import AnimalCard from "../components/AnimalCard";
import DonateModal from "../components/DonateModal";
import { animals as seed } from "../data/animals";
import { HandHeart } from "lucide-react";

export default function Animals() {
  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") === "adopt" ? "adopt" : "donate";
  const [tab, setTab] = useState(initialTab);

  const [items, setItems] = useState(seed);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setParams({ tab });
  }, [tab, setParams]);

  const filtered = useMemo(
    () => items.filter((a) => a.category === tab),
    [items, tab]
  );

  const openDonate = (animal) => {
    setSelected(animal);
    setModalOpen(true);
  };

  const handleSuccess = ({ amount }) => {
    setItems((prev) =>
      prev.map((a) =>
        a.id === selected.id
          ? { ...a, raised: Math.min(a.goal, a.raised + amount) }
          : a
      )
    );
    setModalOpen(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Animals</h1>
          <p className="mt-2 text-zinc-600">
            Donate to medical needs or adopt recovered dogs ready for a home.
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

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((a) => (
          <AnimalCard key={a.id} item={a} onDonate={openDonate} />
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
            <HandHeart />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Donate for general rescue needs</h2>
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
    </main>
  );
}
