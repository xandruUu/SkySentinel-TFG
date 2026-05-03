import FiltersPanel from "./FiltersPanel.jsx";

export default function MobileFiltersDrawer({
  open,
  onClose,
  filterPanelProps,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-white md:hidden">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
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

        <div className="panel-scroll-area min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3">
          <FiltersPanel {...filterPanelProps} />
        </div>
      </div>
    </div>
  );
}