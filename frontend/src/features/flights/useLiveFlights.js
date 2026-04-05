import { useEffect, useMemo, useRef, useState } from "react";
import { fetchLiveFlights } from "./flightsApi.js";

export function useLiveFlights({ token, bounds, refreshMs = 10000 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  const boundsKey = useMemo(() => {
    if (!bounds) return "";
    return `${bounds.lamin}|${bounds.lomin}|${bounds.lamax}|${bounds.lomax}`;
  }, [bounds]);

  useEffect(() => {
    if (!token || !bounds) return;

    let cancelled = false;

    async function tick() {
      if (inFlight.current) return;
      inFlight.current = true;
      setError("");

      try {
        const res = await fetchLiveFlights({ token, bounds });
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Fallo cargando vuelos.");
      } finally {
        inFlight.current = false;
      }
    }

    tick();
    const id = setInterval(tick, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, boundsKey, refreshMs, bounds]);

  return { data, error };
}
