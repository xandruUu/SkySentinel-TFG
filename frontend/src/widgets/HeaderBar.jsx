export default function HeaderBar({ title, onBack }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/10 transition hover:bg-white"
      >
        ← Volver
      </button>

      <h2 className="text-base font-bold text-ink">{title}</h2>

      <span className="text-sm font-semibold text-radar">SkySentinel</span>
    </div>
  );
}