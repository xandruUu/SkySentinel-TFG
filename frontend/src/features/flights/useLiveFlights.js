import { useEffect, useRef, useState } from "react";
import { fetchLiveFlights } from "./flightsApi.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function useLiveFlights({
  token,
  boundsRef,
  enabled = true,
  baseRefreshMs = 25000,
  minRefreshMs = 15000,
  maxRefreshMs = 120000,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshMs, setRefreshMs] = useState(baseRefreshMs);

  const inFlight = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !token || !boundsRef?.current) return;

    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      if (document.hidden) return; // pausa si la pestaña no está visible
      if (inFlight.current) return;

      inFlight.current = true;
      setError("");

      try {
        const bounds = boundsRef.current;
        const res = await fetchLiveFlights({ token, bounds });
        if (!cancelled) {
          setData(res);
          // si todo va bien, vuelve gradualmente al base
          setRefreshMs((prev) => clamp(Math.floor(prev * 0.8), minRefreshMs, baseRefreshMs));
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e?.message || "Fallo cargando vuelos.";
          setError(msg);

          // backoff progresivo
          setRefreshMs((prev) => clamp(prev * 2, baseRefreshMs, maxRefreshMs));
        }
      } finally {
        inFlight.current = false;
      }
    }

    // tick inicial
    tick();

    // Intervalo único (no se reinicia por cambios de bounds)
    timerRef.current = setInterval(tick, refreshMs);

    // Si refreshMs cambia por backoff, reajusta el intervalo
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, token, boundsRef, refreshMs, baseRefreshMs, minRefreshMs, maxRefreshMs]);

  return {
    data,
    error,
    meta: { refreshMs },
  };
}
