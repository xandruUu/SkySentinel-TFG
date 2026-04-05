import { useState } from "react";
import { useFavorites } from "../../features/favorites/useFavorites.js";

function formatSpeed(ms) {
  if (typeof ms !== "number") return "—";
  const kmh = ms * 3.6;
  return `${kmh.toFixed(0)} km/h`;
}

function formatAlt(m) {
  if (typeof m !== "number") return "—";
  return `${m.toFixed(0)} m`;
}

export default function FlightPopup({ aircraft, onClose }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [busy, setBusy] = useState(false);

  const fav = isFavorite(aircraft?.icao24);

  const doToggle = async () => {
    if (!aircraft?.icao24) return;
    setBusy(true);
    try {
      await toggleFavorite({ icao24: aircraft.icao24, callsign: aircraft.callsign });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-[260px] max-w-[320px] rounded-2xl bg-white p-4 ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-primary">{aircraft.callsign || "Sin callsign"}</p>
          <p className="text-xs text-muted">{aircraft.icao24}</p>
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
          <span className="font-semibold">País:</span> {aircraft.origin_country || "—"}
        </p>
        <p>
          <span className="font-semibold">Velocidad:</span> {formatSpeed(aircraft.velocity)}
        </p>
        <p>
          <span className="font-semibold">Altitud:</span> {formatAlt(aircraft.geo_altitude ?? aircraft.baro_altitude)}
        </p>
        <p>
          <span className="font-semibold">Rumbo:</span> {typeof aircraft.true_track === "number" ? `${aircraft.true_track.toFixed(0)}°` : "—"}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          disabled={busy}
          onClick={doToggle}
          className={`flex-1 rounded-2xl px-3 py-2 text-sm font-bold ring-1 ring-primary/10 ${
            fav ? "bg-radar text-white" : "bg-card text-ink"
          }`}
        >
          {fav ? "Quitar favorito" : "Añadir favorito"}
        </button>
      </div>
    </div>
  );
}
