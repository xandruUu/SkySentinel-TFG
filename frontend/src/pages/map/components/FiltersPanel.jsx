import {
  AIRCRAFT_MODELS,
  AIRLINES,
  COUNTRIES,
  MAX_ALTITUDE_M,
  MAX_SPEED_KMH,
  MIN_ALTITUDE_M,
  MIN_SPEED_KMH,
} from "../constants/mapConstants.js";
import { clampNumber } from "../utils/mapFormatters.js";

export default function FiltersPanel({
  filters,
  setFilters,
  data,
  visibleAircraftCount,
  alerts,
  alertsLoading,
  alertsError,
  selectedModel,
  setSelectedModel,
  selectedCompany,
  setSelectedCompany,
  submittingAlert,
  onCreateAlert,
  onDeleteAlert,
}) {
  return (
    <div className="w-full rounded-3xl bg-white/92 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>

      <div className="mt-1 text-sm text-slate-500">
        {data?.aircraft_count ?? 0} detectados · {visibleAircraftCount} visibles ·
        refresh 15s
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Buscar aeronave
          </label>

          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder="Callsign, ICAO24 o matrícula"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Este buscador solo filtra por identificadores. País, velocidad y
            altitud tienen filtros propios.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            País de origen
          </label>

          <select
            value={filters.country}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, country: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
          >
            {COUNTRIES.map((country) => (
              <option key={country.label} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
          <p className="text-sm font-black text-primary">Altitud</p>

          <p className="mt-1 text-xs font-semibold text-muted">
            Rango permitido: {MIN_ALTITUDE_M} m -{" "}
            {MAX_ALTITUDE_M.toLocaleString("es-ES")} m. 0 m representa tierra y
            13.000 m equivale aproximadamente a 41.000 ft.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Mínima
              </label>

              <input
                type="number"
                min={MIN_ALTITUDE_M}
                max={MAX_ALTITUDE_M}
                value={filters.minAltitude}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    minAltitude: clampNumber(
                      event.target.value,
                      MIN_ALTITUDE_M,
                      MAX_ALTITUDE_M
                    ),
                  }))
                }
                placeholder="0 m"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Máxima
              </label>

              <input
                type="number"
                min={MIN_ALTITUDE_M}
                max={MAX_ALTITUDE_M}
                value={filters.maxAltitude}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxAltitude: clampNumber(
                      event.target.value,
                      MIN_ALTITUDE_M,
                      MAX_ALTITUDE_M
                    ),
                  }))
                }
                placeholder="13000 m"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
          <p className="text-sm font-black text-primary">Velocidad</p>

          <p className="mt-1 text-xs font-semibold text-muted">
            Rango permitido: {MIN_SPEED_KMH} km/h - {MAX_SPEED_KMH} km/h.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Mínima
              </label>

              <input
                type="number"
                min={MIN_SPEED_KMH}
                max={MAX_SPEED_KMH}
                value={filters.minSpeed}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    minSpeed: clampNumber(
                      event.target.value,
                      MIN_SPEED_KMH,
                      MAX_SPEED_KMH
                    ),
                  }))
                }
                placeholder="0 km/h"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Máxima
              </label>

              <input
                type="number"
                min={MIN_SPEED_KMH}
                max={MAX_SPEED_KMH}
                value={filters.maxSpeed}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxSpeed: clampNumber(
                      event.target.value,
                      MIN_SPEED_KMH,
                      MAX_SPEED_KMH
                    ),
                  }))
                }
                placeholder="1050 km/h"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center justify-between text-sm text-slate-800">
          <span>Ocultar en tierra</span>

          <input
            type="checkbox"
            checked={filters.hideGround}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                hideGround: event.target.checked,
              }))
            }
          />
        </label>

        <label className="flex items-center justify-between text-sm text-slate-800">
          <span>Solo en vuelo</span>

          <input
            type="checkbox"
            checked={filters.onlyInAir}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                onlyInAir: event.target.checked,
              }))
            }
          />
        </label>

        <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
          <p className="text-sm font-black text-primary">Crear alerta</p>

          <p className="mt-1 text-xs font-semibold text-muted">
            Las alertas funcionan como filtros permanentes de vigilancia.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Modelo de aeronave
              </label>

              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="">Seleccionar modelo</option>

                {AIRCRAFT_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onCreateAlert("model")}
                disabled={!selectedModel || submittingAlert}
                className="mt-2 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Crear alerta por modelo
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Compañía / callsign
              </label>

              <select
                value={selectedCompany}
                onChange={(event) => setSelectedCompany(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="">Seleccionar compañía</option>

                {AIRLINES.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onCreateAlert("company")}
                disabled={!selectedCompany || submittingAlert}
                className="mt-2 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Crear alerta por compañía
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 ring-1 ring-primary/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-primary">Alertas activas</p>

            <span className="rounded-full bg-card px-2 py-1 text-xs font-black text-primary">
              {alerts.length}
            </span>
          </div>

          {alertsError && (
            <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {alertsError}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {alertsLoading && alerts.length === 0 && (
              <p className="text-xs font-semibold text-muted">
                Cargando alertas...
              </p>
            )}

            {!alertsLoading && alerts.length === 0 && (
              <p className="text-xs font-semibold text-muted">
                No hay alertas creadas.
              </p>
            )}

            {alerts.map((alert) => (
              <div
                key={alert.id || alert.alert_id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 px-3 py-2"
              >
                <p className="truncate text-xs font-black text-ink">
                  {alert.aircraft_model || alert.model
                    ? `Modelo · ${alert.aircraft_model || alert.model}`
                    : `Compañía · ${
                        alert.operator_company || alert.operator || "—"
                      }`}
                </p>

                <button
                  type="button"
                  onClick={() => onDeleteAlert(alert.id || alert.alert_id)}
                  className="shrink-0 rounded-xl px-2 py-1 text-xs font-black text-red-600 ring-1 ring-red-100 hover:bg-red-50"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setFilters({
              query: "",
              hideGround: false,
              onlyInAir: false,
              country: "",
              minAltitude: "",
              maxAltitude: "",
              minSpeed: "",
              maxSpeed: "",
            })
          }
          className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
        >
          Resetear filtros
        </button>
      </div>
    </div>
  );
}