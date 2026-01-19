// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import EditAnimalModal from "../components/EditAnimalModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Tabs from "../components/Tabs";

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

  const API = import.meta.env.VITE_API_URL;

  // states
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);

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
  const [receiptFilter, setReceiptFilter] = useState("all"); // all | pending | uploaded
  const [sortMode, setSortMode] = useState("pending_first"); // pending_first | uploaded_first | newest


  const [q, setQ] = useState("");

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

      const res = await fetch(`${API}/api/animals`);
      if (!res.ok) throw new Error("Failed to load animals");

      const data = await res.json();
      setAnimals(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e?.message || "Error loading animals");
    } finally {
      setLoadingList(false);
    }
  };

  // reset filter
  useEffect(() => {
    if (tab !== "goal_reached") {
      setReceiptFilter("all");
      setSortMode("pending_first");
    }
  }, [tab]);

  useEffect(() => {
    loadAnimals();
  }, []);

 const filteredAnimals = useMemo(() => {
  const isGoalReached = (a) => {
    const g = Number(a.goal || 0);
    const r = Number(a.raised || 0);
    return a.category === "donate" && Number.isFinite(g) && g > 0 && r >= g;
  };

  let base = [];
  if (tab === "donate") {

    base = animals.filter((a) => a.category === "donate" && !isGoalReached(a));
  } else if (tab === "adopt") {
    base = animals.filter((a) => a.category === "adopt");
  } else if (tab === "goal_reached") {

    base = animals.filter((a) => isGoalReached(a));

    if (receiptFilter === "pending") base = base.filter((a) => !a.receiptUrl);
    if (receiptFilter === "uploaded") base = base.filter((a) => Boolean(a.receiptUrl));
  } else {
   
    base = animals;
  }

  // search filter
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

  //sort
  const copy = [...base];
  if (tab === "goal_reached") {
    if (sortMode === "pending_first") {
      copy.sort((a, b) => Number(Boolean(a.receiptUrl)) - Number(Boolean(b.receiptUrl)));
    } else if (sortMode === "uploaded_first") {
      copy.sort((a, b) => Number(Boolean(b.receiptUrl)) - Number(Boolean(a.receiptUrl)));
    } else if (sortMode === "newest") {
      copy.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }

  return copy;
  }, [animals, tab, q, receiptFilter, sortMode]);

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

      const res = await fetch(`${API}/api/animals`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create animal");
      }

      const created = await res.json();
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
            <label className="text-sm font-semibold">Image *</label>
              <input
                type="file"
                disabled={uploadingImage}
                accept="image/*"
                className={`mt-1 block w-full text-sm ${fieldErrors.imageUrl ? "text-red-700" : ""}`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setUploadingImage(true);
                    const token = await getToken();

                    const formData = new FormData();
                    formData.append("file", file);

                    const res = await fetch(`${API}/api/admin/uploads/animal-image`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });

                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data?.error || "Image upload failed");

                    setForm((prev) => ({ ...prev, imageUrl: data.url }));
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.imageUrl;
                      return copy;
                    });
                  } catch (err) {
                    alert(err?.message || "Upload failed");
                  } finally {
                    setUploadingImage(false);
                    e.target.value = ""; // allow selecting same file again
                  }
                }}
              />

              {form.imageUrl && (
                <div className="mt-3 rounded-2xl border border-zinc-200 overflow-hidden">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}

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
              disabled={saving || uploadingImage}
            >
              {saving ? "Saving..." : uploadingImage ? "Uploading image..." : "Add Animal"}

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
                { value: "goal_reached", label: "Goal Reached" },
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

        {tab === "goal_reached" && (
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
              `${API}/api/animals/${deleteAnimal.id}`,
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
