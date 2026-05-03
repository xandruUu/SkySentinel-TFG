export function isMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
  );
}

export function normalizeText(value) {
  return String(value || "").trim().toUpperCase();
}

export function clampNumber(value, min, max) {
  if (value === "") return "";

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  return String(Math.min(max, Math.max(min, parsedValue)));
}

export function formatTime(timestamp) {
  if (!timestamp) return "—";

  return new Date(timestamp).toLocaleTimeString();
}

export function formatSpeed(ms) {
  if (typeof ms !== "number") return "—";

  return `${Math.round(ms * 3.6)} km/h`;
}

export function formatAltitude(meters) {
  if (typeof meters !== "number") return "—";

  return `${Math.round(meters)} m`;
}

export function formatTrack(track) {
  if (typeof track !== "number") return "—";

  return `${Math.round(track)}°`;
}

export function formatCoord(value) {
  if (typeof value !== "number") return "—";

  return value.toFixed(4);
}

export function formatPositionSource(value) {
  if (value === 0) return "ADS-B";
  if (value === 1) return "ASTERIX";
  if (value === 2) return "MLAT";

  return "—";
}