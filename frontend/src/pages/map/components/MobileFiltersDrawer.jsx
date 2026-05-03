import FiltersPanel from "./FiltersPanel.jsx";

export default function MobileFiltersDrawer({
  open,
  onClose,
  filterPanelProps,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden">
      <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-[32px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Panel
            </p>
            <h2 className="text-lg font-black text-primary">Filtros</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="panel-scroll-area max-h-[calc(88dvh-68px)] overflow-y-auto p-3">
          <FiltersPanel {...filterPanelProps} />
        </div>
      </div>
    </div>
  );
}