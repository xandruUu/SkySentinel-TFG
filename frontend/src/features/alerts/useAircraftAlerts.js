import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveFlights } from "../flights/useLiveFlights.js";

const ALERTS_STORAGE_KEY = "skysentinel.aircraftAlerts.v1";
const NOTIFIED_STORAGE_KEY = "skysentinel.notifiedAlerts.v1";

const MADRID_BOUNDS = {
  lamin: 40.0,
  lomin: -4.5,
  lamax: 41.5,
  lomax: -2.5,
};

function normalizeText(value) {
  return String(value || "").trim().toUpperCase();
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAircraftModel(aircraft) {
  return normalizeText(
    aircraft?.model ||
      aircraft?.aircraft_model ||
      aircraft?.typecode ||
      aircraft?.type ||
      ""
  );
}

function getAircraftOperator(aircraft) {
  return normalizeText(
    aircraft?.operator ||
      aircraft?.airline ||
      aircraft?.callsign ||
      aircraft?.origin_country ||
      ""
  );
}

function getAircraftLabel(aircraft) {
  return (
    normalizeText(aircraft?.callsign) ||
    normalizeText(aircraft?.icao24) ||
    "Aeronave detectada"
  );
}

function matchesAlert(aircraft, alert) {
  const alertModel = normalizeText(alert.model);
  const alertOperator = normalizeText(alert.operator);

  const aircraftModel = getAircraftModel(aircraft);
  const aircraftOperator = getAircraftOperator(aircraft);
  const aircraftCallsign = normalizeText(aircraft?.callsign);
  const aircraftCountry = normalizeText(aircraft?.origin_country);

  const modelOk =
    !alertModel ||
    aircraftModel.includes(alertModel) ||
    alertModel.includes(aircraftModel);

  const operatorOk =
    !alertOperator ||
    aircraftOperator.includes(alertOperator) ||
    aircraftCallsign.includes(alertOperator) ||
    aircraftCountry.includes(alertOperator);

  return modelOk && operatorOk;
}

function canNotify() {
  return "Notification" in window && Notification.permission === "granted";
}

function sendNotification({ alert, aircraft }) {
  if (!canNotify()) return;

  const title = "SkySentinel alerta";
  const body = `${getAircraftLabel(aircraft)} coincide con ${
    alert.model || "modelo libre"
  } · ${alert.operator || "operador libre"}`;

  new Notification(title, {
    body,
    icon: "/icons/icon-192.png",
    tag: `skysentinel-${alert.id}-${aircraft.icao24 || aircraft.callsign}`,
  });
}

export function useAircraftAlerts({ enabled = true } = {}) {
  const [alerts, setAlerts] = useState(() => loadJson(ALERTS_STORAGE_KEY, []));
  const [matches, setMatches] = useState([]);
  const [lastScanAt, setLastScanAt] = useState(null);

  const notifiedRef = useRef(new Set(loadJson(NOTIFIED_STORAGE_KEY, [])));

  const { data, error, loading, lastUpdatedAt } = useLiveFlights({
    bounds: MADRID_BOUNDS,
    refreshMs: 15000,
    enabled,
  });

  const states = useMemo(() => data?.states || [], [data]);

  const saveAlerts = (nextAlerts) => {
    setAlerts(nextAlerts);
    saveJson(ALERTS_STORAGE_KEY, nextAlerts);
  };

  const createAlert = ({ model, operator }) => {
    const nextAlert = {
      id: crypto.randomUUID(),
      model: normalizeText(model),
      operator: normalizeText(operator),
      createdAt: new Date().toISOString(),
    };

    saveAlerts([nextAlert, ...alerts]);
  };

  const deleteAlert = (id) => {
    saveAlerts(alerts.filter((alert) => alert.id !== id));
  };

  useEffect(() => {
    if (!enabled || alerts.length === 0 || states.length === 0) {
      setMatches([]);
      return;
    }

    const nextMatches = [];

    for (const alert of alerts) {
      for (const aircraft of states) {
        if (!matchesAlert(aircraft, alert)) continue;

        const aircraftKey = aircraft.icao24 || aircraft.callsign || "unknown";
        const notificationKey = `${alert.id}:${aircraftKey}`;

        nextMatches.push({
          id: notificationKey,
          alert,
          aircraft,
        });

        if (!notifiedRef.current.has(notificationKey)) {
          sendNotification({ alert, aircraft });
          notifiedRef.current.add(notificationKey);
        }
      }
    }

    saveJson(NOTIFIED_STORAGE_KEY, Array.from(notifiedRef.current));
    setMatches(nextMatches);
    setLastScanAt(Date.now());
  }, [alerts, states, enabled]);

  return {
    alerts,
    matches,
    createAlert,
    deleteAlert,
    loading,
    error,
    lastUpdatedAt,
    lastScanAt,
    aircraftCount: states.length,
  };
}