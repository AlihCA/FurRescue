import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import ProofUploadModal from "./ProofUploadModal";

export default function EditAnimalModal({ open, onClose, animal, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [receiptOpen, setReceiptOpen] = useState(false);

  const { getToken } = useAuth();

  const API = import.meta.env.VITE_API_URL;

  const goalReached = useMemo(() => {
    const g = Number(form?.goal || 0);
    const r = Number(form?.raised || 0);
    return Number.isFinite(g) && g > 0 && Number.isFinite(r) && r >= g;
  }, [form?.goal, form?.raised]);

 
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

  useEffect(() => {
    if (!open || !animal) return;

    setMsg(null);
    setFieldErrors({});
    setUploadingImage(false);

    setForm({
      id: animal.id,
      category: animal.category || "donate",
      name: animal.name || "",
      gender: animal.gender || "",
      breed: animal.breed || "",
      age: animal.age || "",
      shelter: animal.shelter || "",
      medicalNeeds: animal.medicalNeeds || "",
      about: animal.about || "",
      fbLink: animal.fbLink || "",
      imageUrl: animal.imageUrl || "",
      goal: animal.goal ?? "",
      raised: animal.raised ?? 0,

      receiptUrl: animal.receiptUrl || "",
      status: animal.status || "",

    });
  }, [open, animal]);

  const isDonate = useMemo(
    () => (form?.category || "donate") === "donate",
    [form]
  );

  if (!open || !animal || !form) return null;

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

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

    req("name");
    req("gender");
    req("breed");
    req("age");
    req("shelter");
    req("imageUrl");

    if (isDonate) {
      req("medicalNeeds");

      const g = Number(form.goal);
      if (!String(form.goal).trim()) e.goal = "Please fill out this field.";
      else if (!Number.isFinite(g) || g <= 0) e.goal = "Goal must be a positive number.";

      const r = Number(form.raised);
      if (!Number.isFinite(r) || r < 0) e.raised = "Raised must be 0 or more.";
      else if (Number.isFinite(g) && g > 0 && r > g) e.raised = "Raised cannot exceed goal.";
    } else {
      req("about");
      req("fbLink");
    }

    setFieldErrors(e);
    return e;
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

  const save = async (ev) => {
    ev.preventDefault();
    setMsg(null);

    const e = validate();
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      refs[firstKey]?.current?.focus?.();
      return;
    }

    try {
      setUploadingImage(true);

      const payload = {
        category: form.category,
        name: form.name.trim(),
        gender: form.gender.trim(),
        breed: form.breed.trim(),
        age: form.age.trim(),
        shelter: form.shelter.trim(),
        imageUrl: form.imageUrl.trim(),
      };

      if (isDonate) {
        payload.medicalNeeds = form.medicalNeeds.trim();
        payload.goal = Number(form.goal);
        payload.raised = Number(form.raised || 0);
      } else {
        payload.about = form.about.trim();
        payload.fbLink = form.fbLink.trim();
      }

      const token = await getToken();

      const res = await fetch(`${API}/api/animals/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update animal");
      }

      const updated = await res.json();

      setMsg({ type: "success", text: "Saved changes!" });
      setTimeout(() => setMsg(null), 2500);

      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      setMsg({ type: "error", text: err?.message || "Error" });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-zinc-200 shadow-xl p-6 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl hover:bg-zinc-100"
          aria-label="Close"
          type="button"
        >
          <X />
        </button>

        <h2 className="text-xl font-extrabold">Edit: {animal.name}</h2>
        <p className="mt-1 text-sm text-zinc-600">Update animal details.</p>

        {msg && (
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border
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

        <form onSubmit={save} className="mt-5 grid md:grid-cols-2 gap-4">
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
            />
            <FieldError k="shelter" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold">Image *</label>

            <input
              type="file"
              accept="image/*"
              disabled={uploadingImage || saving}
              className={`mt-1 block w-full text-sm ${
                fieldErrors.imageUrl ? "text-red-700" : ""
              }`}
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
                  e.target.value = "";
                }
              }}
            />

            {uploadingImage && (
              <p className="mt-2 text-xs font-semibold text-zinc-600">
                Uploading image…
              </p>
            )}

            {form.imageUrl && (
              <div className="mt-3 rounded-2xl border border-zinc-200 overflow-hidden">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <FieldError k="imageUrl" />
          </div>

          {isDonate && (form.status === "completed" || form.status === "finalized") && (
            <div className="md:col-span-2 mt-2 rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-extrabold">Receipt (Transparency)</p>
              <p className="text-xs text-zinc-600 mt-1">
                You can replace the receipt if a wrong file was uploaded.
              </p>

              <div className="mt-3 flex gap-2">
                {form.receiptUrl && (
                  <a
                    href={form.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl px-4 py-2 font-extrabold border border-zinc-200 hover:bg-zinc-50"
                  >
                    View current receipt
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setReceiptOpen(true)}
                  className="btn-pink rounded-2xl px-4 py-2 font-extrabold"
                >
                  {form.receiptUrl ? "Replace Receipt" : "Upload Receipt"}
                </button>
              </div>
            </div>
          )}

          {isDonate ? (
            <>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Medical needs *</label>
                <input
                  ref={refs.medicalNeeds}
                  value={form.medicalNeeds}
                  onChange={onChange("medicalNeeds")}
                  className={inputClass("medicalNeeds")}
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
                  className={`${inputClass("goal")} ${goalReached ? "bg-zinc-100 text-zinc-500 cursor-not-allowed" : ""}`}
                />
                {goalReached && (
                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    Goal has been reached.
                  </p>
                )}
                <FieldError k="goal" />
              </div>

              <div>
                <label className="text-sm font-semibold">Raised (PHP)</label>
                <input
                  value={form.raised}
                  onChange={onChange("raised")}
                  inputMode="numeric"
                  disabled={goalReached}
                  className={`${inputClass("raised")} ${goalReached ? "bg-zinc-100 text-zinc-500 cursor-not-allowed" : ""}`}
                />
                {goalReached && (
                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    Raised lock because Goal has been reached.
                  </p>
                )}

                <FieldError k="raised" />
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
                />
                <FieldError k="fbLink" />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="btn-pink rounded-2xl px-5 py-3 font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : uploadingImage ? "Uploading image..." : "Save changes"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-soft rounded-2xl px-5 py-3 font-extrabold text-pink-700 transition-all"
            >
              Cancel
            </button>
          </div>
            <ProofUploadModal
              open={receiptOpen}
              onClose={() => setReceiptOpen(false)}
              animalId={animal.id}
              animalName={animal.name}
              onUploaded={(updatedAnimal) => {
                setForm((prev) => ({
                  ...prev,
                  receiptUrl: updatedAnimal?.receiptUrl || prev.receiptUrl,
                  status: updatedAnimal?.status || prev.status,
                }));

                onSaved?.(updatedAnimal);

                setReceiptOpen(false);
              }}
            />

        </form>
      </div>
    </div>
  );
}
