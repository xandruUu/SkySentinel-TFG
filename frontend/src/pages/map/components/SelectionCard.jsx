import {
  formatAltitude,
  formatCoord,
  formatPositionSource,
  formatSpeed,
  formatTime,
  formatTrack,
} from "../utils/mapFormatters.js";

export default function SelectionCard({
  aircraft,
  expanded,
  setExpanded,
  onClose,
}) {
  if (!aircraft) return null;

  const compactSummary = `${aircraft.on_ground ? "En tierra" : "En vuelo"} · ${formatSpeed(
    aircraft.velocity
  )} · ${formatAltitude(aircraft.geo_altitude ?? aircraft.baro_altitude)}`;

  return (
    <div className="absolute bottom-4 left-3 right-3 z-20 md:left-auto md:right-4 md:bottom-4 md:w-[380px] md:max-w-[calc(100vw-2rem)]">
      <div
        className={`panel-scroll-area rounded-3xl bg-white/95 p-4 shadow-2xl ring-1 ring-slate-200 backdrop-blur ${
          expanded ? "max-h-[52dvh] overflow-y-auto" : "overflow-hidden"
        } md:max-h-none`}
      >
        <div className="mb-3 flex justify-center md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold text-primary">
              {aircraft.callsign || "Sin callsign"}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-500">
              ICAO24 · {aircraft.icao24 || "—"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              Modelo · {aircraft.aircraft_model || aircraft.model || "Desconocido"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              Operador · {aircraft.operator_company || "Desconocido"}
            </p>

            {aircraft.alert_label && (
              <p
                className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black text-white"
                style={{ backgroundColor: aircraft.alert_color || "#ef4444" }}
              >
                Alerta · {aircraft.alert_label}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 md:hidden"
            >
              {expanded ? "Ver menos" : "Ver más"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        {!expanded ? (
          <div className="pt-3">
            <p className="text-sm font-semibold text-slate-800">
              {compactSummary}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {formatCoord(aircraft.latitude)}, {formatCoord(aircraft.longitude)}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="font-bold text-slate-700">País</p>
              <p className="break-words text-slate-900">
                {aircraft.origin_country || "—"}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Estado</p>
              <p className="text-slate-900">
                {aircraft.on_ground ? "En tierra" : "En vuelo"}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Velocidad</p>
              <p className="text-slate-900">{formatSpeed(aircraft.velocity)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Rumbo</p>
              <p className="text-slate-900">{formatTrack(aircraft.true_track)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Altitud geo</p>
              <p className="text-slate-900">
                {formatAltitude(aircraft.geo_altitude)}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Altitud baro</p>
              <p className="text-slate-900">
                {formatAltitude(aircraft.baro_altitude)}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Latitud</p>
              <p className="text-slate-900">{formatCoord(aircraft.latitude)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Longitud</p>
              <p className="text-slate-900">{formatCoord(aircraft.longitude)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Matrícula</p>
              <p className="text-slate-900">{aircraft.registration || "—"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Squawk</p>
              <p className="text-slate-900">{aircraft.squawk || "—"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">SPI</p>
              <p className="text-slate-900">{aircraft.spi ? "Sí" : "No"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Fuente posición</p>
              <p className="text-slate-900">
                {formatPositionSource(aircraft.position_source)}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Último contacto</p>
              <p className="text-slate-900">{formatTime(aircraft.last_contact)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}