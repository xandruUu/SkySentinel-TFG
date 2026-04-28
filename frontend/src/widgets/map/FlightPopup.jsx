function formatSpeed(ms) {
  if (typeof ms !== "number") return "—";
  const kmh = ms * 3.6;
  return `${kmh.toFixed(0)} km/h`;
}

function formatAlt(m) {
  if (typeof m !== "number") return "—";
  return `${m.toFixed(0)} m`;
}

function valueOrDash(value) {
  return value || "—";
}

export default function FlightPopup({ aircraft, onClose }) {
  const model = aircraft?.aircraft_model || aircraft?.model;
  const operator = aircraft?.operator_company;
  const registration = aircraft?.registration;

  return (
    <div className="min-w-[260px] max-w-[320px] rounded-2xl bg-white p-4 ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-primary">
            {aircraft?.callsign || "Sin callsign"}
          </p>
          <p className="text-xs text-muted">{aircraft?.icao24 || "—"}</p>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl px-2 py-1 text-sm font-semibold hover:bg-card"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 space-y-1 text-sm text-ink">
        <p>
          <span className="font-semibold">Modelo:</span> {valueOrDash(model)}
        </p>

        <p>
          <span className="font-semibold">Operador:</span> {valueOrDash(operator)}
        </p>

        <p>
          <span className="font-semibold">Matrícula:</span>{" "}
          {valueOrDash(registration)}
        </p>

        <p>
          <span className="font-semibold">País:</span>{" "}
          {valueOrDash(aircraft?.origin_country)}
        </p>

        <p>
          <span className="font-semibold">Velocidad:</span>{" "}
          {formatSpeed(aircraft?.velocity)}
        </p>

        <p>
          <span className="font-semibold">Altitud:</span>{" "}
          {formatAlt(aircraft?.geo_altitude ?? aircraft?.baro_altitude)}
        </p>

        <p>
          <span className="font-semibold">Rumbo:</span>{" "}
          {typeof aircraft?.true_track === "number"
            ? `${aircraft.true_track.toFixed(0)}°`
            : "—"}
        </p>
      </div>
    </div>
  );
}