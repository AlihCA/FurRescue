export default function Tabs({ value, onChange, items }) {
  return (
    <div className="card inline-flex rounded-3xl p-1">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={[
              "px-4 py-2 rounded-2xl text-sm font-extrabold transition-all",
              active
                ? "btn-pink shadow-[0_12px_30px_rgba(236,72,153,.22)]"
                : "text-zinc-700 hover:bg-pink-100/70",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
