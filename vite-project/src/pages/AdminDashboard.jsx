// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import EditAnimalModal from "../components/EditAnimalModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Tabs from "../components/Tabs";
import AdminNotifications from "../components/AdminNotifications";

export default function AdminDashboard() {
  const [form, setForm] = useState({
    category: "donate",
    name: "",
    gender: "",
    breed: "",
    age: "",
    shelter: "",
    medicalNeeds: "",
    about: "",
    fbLink: "",
    imageUrl: "",
    goal: "",
  });

  const refs = {
    name: useRef(null),
    gender: useRef(null),
    breed: useRef(null),
    age: useRef(null),
    shelter: useRef(null),
    imageUrl: useRef(null),
    medicalNeeds: useRef(null),
    goal: useRef(null),
    about: useRef(null),
    fbLink: useRef(null),
  };

  const { getToken } = useAuth();

  const authHeaders = async () => {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // states
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [editOpen, setEditOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAnimal, setDeleteAnimal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // list state
  const [tab, setTab] = useState("donate");
  const [animals, setAnimals] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const isDonate = form.category === "donate";

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

    // remove field error when user starts fixing it
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const validate = () => {
    const e = {};
    const req = (key, label = "Please fill out this field.") => {
      if (!String(form[key] ?? "").trim()) e[key] = label;
    };

    // required for ALL animals
    req("name");
    req("gender");
    req("breed");
    req("age");
    req("shelter");
    req("imageUrl");

    // category-specific
    if (isDonate) {
      req("medicalNeeds");
      const g = Number(form.goal);
      if (!String(form.goal).trim()) e.goal = "Please fill out this field.";
      else if (!Number.isFinite(g) || g <= 0) e.goal = "Goal must be a positive number.";
    } else {
      req("about");
      req("fbLink");
    }

    setFieldErrors(e);
    return e;
  };

  // load animals list
  const loadAnimals = async () => {
    try {
      setLoadingList(true);
      setListError("");

      const res = await fetch("http://localhost:4000/api/animals");
      if (!res.ok) throw new Error("Failed to load animals");

      const data = await res.json();
      setAnimals(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e?.message || "Error loading animals");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => a.category === tab);
  }, [animals, tab]);

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);

    const e = validate();
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      refs[firstKey]?.current?.focus?.();
      return;
    }

    try {
      setSaving(true);

      const payload = {
        category: form.category,
        name: form.name.trim(),
        gender: form.gender.trim(),
        breed: form.breed.trim(),
        age: form.age.trim(),
        shelter: form.shelter.trim(),
        medicalNeeds: isDonate ? form.medicalNeeds.trim() : "",
        about: !isDonate ? form.about.trim() : "",
        fbLink: !isDonate ? form.fbLink.trim() : "",
        imageUrl: form.imageUrl.trim(),
        goal: isDonate ? Number(form.goal) : undefined,
      };

      const res = await fetch("http://localhost:4000/api/animals", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create animal");
      }

      const created = await res.json();

      // ✅ instant UI update (no refetch needed)
      setAnimals((prev) => [created, ...prev]);

      setMsg({ type: "success", text: "Animal created!" });
      setTimeout(() => setMsg(null), 3000);

      setFieldErrors({});
      setForm((prev) => ({
        ...prev,
        name: "",
        gender: "",
        breed: "",
        age: "",
        shelter: "",
        medicalNeeds: "",
        about: "",
        fbLink: "",
        imageUrl: "",
        goal: "",
      }));

      // optional: auto-switch to that tab
      setTab(created.category);
    } catch (err) {
      setMsg({ type: "error", text: err?.message || "Error" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (key) =>
    `mt-1 w-full rounded-xl border px-3 py-2 outline-none transition ${
      fieldErrors[key]
        ? "border-red-400 focus:ring-2 focus:ring-red-200"
        : "border-zinc-300 focus:ring-2 focus:ring-zinc-900/20"
    }`;

  const FieldError = ({ k }) =>
    fieldErrors[k] ? (
      <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors[k]}</p>
    ) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
      <p className="mt-2 text-zinc-600">Add animals for Donate / Adopt.</p>

      <div className="mt-6">
        <AdminNotifications />
      </div>

      {/* ADD FORM */}
      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-extrabold">Add Animal</h2>

        {msg && (
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border
              ${
                msg.type === "success"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }`}
          >
            {msg.type === "success" && <Check size={18} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">Category</label>
            <select
              value={form.category}
              onChange={onChange("category")}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            >
              <option value="donate">donate</option>
              <option value="adopt">adopt</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Name *</label>
            <input
              ref={refs.name}
              value={form.name}
              onChange={onChange("name")}
              className={inputClass("name")}
              placeholder="e.g. Lucky"
            />
            <FieldError k="name" />
          </div>

          <div>
            <label className="text-sm font-semibold">Gender *</label>
            <input
              ref={refs.gender}
              value={form.gender}
              onChange={onChange("gender")}
              className={inputClass("gender")}
              placeholder="e.g. Male"
            />
            <FieldError k="gender" />
          </div>

          <div>
            <label className="text-sm font-semibold">Breed *</label>
            <input
              ref={refs.breed}
              value={form.breed}
              onChange={onChange("breed")}
              className={inputClass("breed")}
              placeholder="e.g. Aspin"
            />
            <FieldError k="breed" />
          </div>

          <div>
            <label className="text-sm font-semibold">Age *</label>
            <input
              ref={refs.age}
              value={form.age}
              onChange={onChange("age")}
              className={inputClass("age")}
              placeholder="e.g. 1 year"
            />
            <FieldError k="age" />
          </div>

          <div>
            <label className="text-sm font-semibold">Shelter *</label>
            <input
              ref={refs.shelter}
              value={form.shelter}
              onChange={onChange("shelter")}
              className={inputClass("shelter")}
              placeholder="e.g. Manila Rescue Hub"
            />
            <FieldError k="shelter" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold">Image URL *</label>
            <input
              ref={refs.imageUrl}
              value={form.imageUrl}
              onChange={onChange("imageUrl")}
              className={inputClass("imageUrl")}
              placeholder="https://..."
            />
            <FieldError k="imageUrl" />
          </div>

          {isDonate ? (
            <>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Medical needs *</label>
                <input
                  ref={refs.medicalNeeds}
                  value={form.medicalNeeds}
                  onChange={onChange("medicalNeeds")}
                  className={inputClass("medicalNeeds")}
                  placeholder="e.g. Skin infection treatment + vitamins"
                />
                <FieldError k="medicalNeeds" />
              </div>

              <div>
                <label className="text-sm font-semibold">Goal (PHP) *</label>
                <input
                  ref={refs.goal}
                  value={form.goal}
                  onChange={onChange("goal")}
                  inputMode="numeric"
                  className={inputClass("goal")}
                  placeholder="e.g. 2000"
                />
                <FieldError k="goal" />
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">About *</label>
                <input
                  ref={refs.about}
                  value={form.about}
                  onChange={onChange("about")}
                  className={inputClass("about")}
                  placeholder="e.g. Friendly, calm, and great with kids."
                />
                <FieldError k="about" />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Facebook link *</label>
                <input
                  ref={refs.fbLink}
                  value={form.fbLink}
                  onChange={onChange("fbLink")}
                  className={inputClass("fbLink")}
                  placeholder="https://facebook.com/..."
                />
                <FieldError k="fbLink" />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="btn-pink rounded-2xl px-5 py-3 font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Animal"}
            </button>
          </div>
        </form>
      </div>

      {/* LIST + TABS */}
      <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">Animals</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Manage your Donate / Adopt cards here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "donate", label: "Donate" },
                { value: "adopt", label: "Adopt" },
              ]}
            />
            <button
              type="button"
              onClick={loadAnimals}
              className="btn-soft rounded-2xl px-4 py-2 font-extrabold text-pink-700 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {loadingList && <p className="mt-4 text-zinc-600">Loading...</p>}
        {listError && <p className="mt-4 text-red-600">{listError}</p>}

        {!loadingList && !listError && (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnimals.map((a) => (
              <div key={a.id} className="card rounded-3xl overflow-hidden">
                <div className="h-40 bg-zinc-100">
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold">{a.name}</p>
                      <p className="text-sm text-zinc-600">
                        {a.breed} • {a.gender} • {a.age}
                      </p>
                    </div>

                    <span className="text-xs font-extrabold px-2 py-1 rounded-full bg-pink-100/70 text-pink-700 border border-pink-200">
                      {a.category}
                    </span>
                  </div>

                  {a.category === "donate" ? (
                    <p className="mt-3 text-sm text-zinc-700">
                      ₱{Number(a.raised).toLocaleString()}/₱
                      {Number(a.goal).toLocaleString()}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-zinc-700 line-clamp-2">
                      {a.about}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditAnimal(a);
                        setEditOpen(true);
                      }}
                      className="btn-soft rounded-2xl px-4 py-2 font-extrabold text-pink-700 transition-all w-full"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteAnimal(a);
                        setDeleteOpen(true);
                      }}
                      className="rounded-2xl px-4 py-2 font-extrabold transition-all w-full border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredAnimals.length === 0 && (
              <p className="text-zinc-600">No animals found for this tab.</p>
            )}
          </div>
        )}
      </div>

      <EditAnimalModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        animal={editAnimal}
        onSaved={(updated) => {
          // ✅ instant UI update after edit
          setAnimals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        }}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        loading={deleting}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteAnimal(null);
        }}
        title={`Delete "${deleteAnimal?.name || ""}"?`}
        description="This will permanently remove the animal from the database."
        onConfirm={async () => {
          if (!deleteAnimal?.id) return;

          try {
            setDeleting(true);

            const token = await getToken();
            const res = await fetch(
              `http://localhost:4000/api/animals/${deleteAnimal.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err?.error || "Failed to delete");
            }

            // ✅ instant UI update after delete
            setAnimals((prev) => prev.filter((a) => a.id !== deleteAnimal.id));

            setDeleteOpen(false);
            setDeleteAnimal(null);
          } catch (e) {
            alert(e?.message || "Delete failed");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </main>
  );
}
