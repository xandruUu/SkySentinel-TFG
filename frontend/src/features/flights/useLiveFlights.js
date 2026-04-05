import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth.js";

async function fetchLiveFlights({ bounds, token }) {
  const params = new URLSearchParams({
    lamin: String(bounds.lamin),
    lomin: String(bounds.lomin),
    lamax: String(bounds.lamax),
    lomax: String(bounds.lomax),
    include_extended_data: "true",
  });

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api/flights/live?${params.toString()}`, {
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${text}`);
  }

  return response.json();
}

export function useLiveFlights({
  bounds,
  refreshMs = 15000,
  enabled = true,
}) {
  const { token, isAuthenticated } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const timerRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled || !bounds || !isAuthenticated || !token) {
      setData(null);
      setLoading(false);
      setError(!token ? "Sin token de autenticación." : "");
      return;
    }

    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        void load();
      }, refreshMs);
    };

    const load = async () => {
      if (cancelled || busyRef.current) return;

      busyRef.current = true;

      try {
        const payload = await fetchLiveFlights({ bounds, token });
        if (cancelled) return;

        setData(payload);
        setError("");
        setLastUpdatedAt(Date.now());
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "No se pudieron cargar los vuelos.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          busyRef.current = false;
          scheduleNext();
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [bounds, enabled, refreshMs, isAuthenticated, token]);

  return {
    data,
    error,
    loading,
    lastUpdatedAt,
  };
}