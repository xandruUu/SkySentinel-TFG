import {
  formatAltitude,
  formatPositionSource,
  formatSpeed,
  formatTime,
  formatTrack,
} from "./mapFormatters.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildPopupHtml(aircraft) {
  const callsign = aircraft.callsign || "Sin callsign";
  const icao24 = aircraft.icao24 || "—";
  const country = aircraft.origin_country || "—";
  const model = aircraft.aircraft_model || aircraft.model || "Desconocido";
  const operator = aircraft.operator_company || "Desconocido";
  const registration = aircraft.registration || "—";
  const status = aircraft.on_ground ? "En tierra" : "En vuelo";

  const alertBadge = aircraft.alert_label
    ? `
      <div style="
        margin-top: 10px;
        display: inline-flex;
        border-radius: 999px;
        padding: 6px 10px;
        background: ${escapeHtml(aircraft.alert_color || "#ef4444")};
        color: white;
        font-size: 11px;
        font-weight: 900;
      ">
        Alerta · ${escapeHtml(aircraft.alert_label)}
      </div>
    `
    : "";

  return `
    <div style="
      min-width: 240px;
      max-width: 300px;
      border-radius: 20px;
      background: white;
      padding: 14px;
      box-shadow: 0 24px 80px rgba(30, 58, 138, 0.18);
      border: 1px solid rgba(148, 163, 184, 0.35);
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
        <div style="
          font-size: 15px;
          font-weight: 900;
          color: #1e3a8a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${escapeHtml(callsign)}
        </div>

        <div style="margin-top: 3px; font-size: 11px; color: #64748b;">
          ICAO24 · ${escapeHtml(icao24)}
        </div>

        ${alertBadge}
      </div>

      <div style="
        margin-top: 10px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 12px;
        font-size: 12px;
      ">
        <div>
          <div style="font-weight: 800; color: #475569;">País</div>
          <div style="color: #0f172a;">${escapeHtml(country)}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Estado</div>
          <div style="color: #0f172a;">${escapeHtml(status)}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Velocidad</div>
          <div style="color: #0f172a;">${escapeHtml(formatSpeed(aircraft.velocity))}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Rumbo</div>
          <div style="color: #0f172a;">${escapeHtml(formatTrack(aircraft.true_track))}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Altitud</div>
          <div style="color: #0f172a;">${escapeHtml(
            formatAltitude(aircraft.geo_altitude ?? aircraft.baro_altitude)
          )}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Fuente</div>
          <div style="color: #0f172a;">${escapeHtml(
            formatPositionSource(aircraft.position_source)
          )}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Modelo</div>
          <div style="color: #0f172a;">${escapeHtml(model)}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Operador</div>
          <div style="color: #0f172a;">${escapeHtml(operator)}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Matrícula</div>
          <div style="color: #0f172a;">${escapeHtml(registration)}</div>
        </div>

        <div>
          <div style="font-weight: 800; color: #475569;">Último contacto</div>
          <div style="color: #0f172a;">${escapeHtml(formatTime(aircraft.last_contact))}</div>
        </div>
      </div>
    </div>
  `;
}