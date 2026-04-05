import TextInput from "../../shared/ui/TextInput.jsx";

export default function FloatingFiltersPanel({ filters, setFilters, statusText }) {
  return (
    <div className="absolute left-4 top-4 z-20 w-[min(360px,calc(100vw-2rem))]">
      <div className="rounded-[24px] bg-white/85 p-4 backdrop-blur ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-primary">Filtros</p>
            <p className="text-xs text-muted">{statusText}</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <TextInput
            label="Buscar (callsign o icao24)"
            value={filters.query}
            onChange={(v) => setFilters((prev) => ({ ...prev, query: v }))}
            placeholder="IBE, RYR, 3c6444..."
            autoComplete="off"
          />

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">Solo favoritos</span>
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(e) => setFilters((p) => ({ ...p, favoritesOnly: e.target.checked }))}
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">Ocultar en tierra</span>
            <input
              type="checkbox"
              checked={filters.hideGround}
              onChange={(e) => setFilters((p) => ({ ...p, hideGround: e.target.checked }))}
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
