import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth.js";
import { useLiveFlights } from "../flights/useLiveFlights.js";

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

function mapApiAlert(alert) {
  return {
    id: alert.alert_id,
    alert_id: alert.alert_id,
    user_id: alert.user_id,
    model: alert.aircraft_model || "",
    operator: alert.operator_company || "",
    aircraft_model: alert.aircraft_model || "",
    operator_company: alert.operator_company || "",
    is_active: alert.is_active,
    createdAt: alert.created_at,
    created_at: alert.created_at,
  };
}

async function apiRequest(path, { token, method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
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
    aircraft?.operator_company ||
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
  const alertModel = normalizeText(alert.model || alert.aircraft_model);
  const alertOperator = normalizeText(alert.operator || alert.operator_company);

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
  const { token, isAuthenticated } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");
  const [lastScanAt, setLastScanAt] = useState(null);

  const notifiedRef = useRef(new Set(loadJson(NOTIFIED_STORAGE_KEY, [])));

  const { data, error, loading, lastUpdatedAt } = useLiveFlights({
    bounds: MADRID_BOUNDS,
    refreshMs: 15000,
    enabled: enabled && isAuthenticated,
  });

  const states = useMemo(() => data?.states || [], [data]);

  const loadAlerts = async () => {
    if (!token) return;

    setAlertsLoading(true);
    setAlertsError("");

    try {
      const payload = await apiRequest("/api/alerts", { token });
      const mappedAlerts = (payload?.items || []).map(mapApiAlert);
      setAlerts(mappedAlerts);
    } catch (err) {
      setAlertsError(err?.message || "No se pudieron cargar las alertas.");
    } finally {
      setAlertsLoading(false);
    }
  };

  const createAlert = async ({ model, operator }) => {
    if (!token) return;

    const createdAlert = await apiRequest("/api/alerts", {
      token,
      method: "POST",
      body: {
        aircraft_model: normalizeText(model) || null,
        operator_company: normalizeText(operator) || null,
      },
    });

    setAlerts((currentAlerts) => [mapApiAlert(createdAlert), ...currentAlerts]);
  };

  const deleteAlert = async (id) => {
    if (!token) return;

    await apiRequest(`/api/alerts/${id}`, {
      token,
      method: "DELETE",
    });

    setAlerts((currentAlerts) =>
      currentAlerts.filter((alert) => alert.id !== id)
    );
  };

  useEffect(() => {
    if (!enabled || !isAuthenticated || !token) {
      setAlerts([]);
      return;
    }

    void loadAlerts();
  }, [enabled, isAuthenticated, token]);

  useEffect(() => {
    if (!enabled || alerts.length === 0 || states.length === 0) {
      setMatches([]);
      return;
    }

    const nextMatches = [];

    for (const alert of alerts) {
      if (alert.is_active === false) continue;

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
    loading: loading || alertsLoading,
    error: error || alertsError,
    lastUpdatedAt,
    lastScanAt,
    aircraftCount: states.length,
    reloadAlerts: loadAlerts,
  };
}