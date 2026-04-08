import { useEffect, useMemo, useRef, useState } from "react";
import { getLiveFlights } from "./flightsApi.js";

function formatTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString();
}

export function useLiveFlights({ bbox, enabled = true }) {
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [nextRefreshSeconds, setNextRefreshSeconds] = useState(15);

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const bboxKey = useMemo(() => {
    if (!bbox) {
      return "";
    }

    return JSON.stringify({
      lamin: bbox.lamin,
      lomin: bbox.lomin,
      lamax: bbox.lamax,
      lomax: bbox.lomax,
    });
  }, [bbox]);

  useEffect(() => {
    function clearScheduledRefresh() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function cancelRequest() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }

    async function fetchFlights() {
      if (!enabled || !bbox) {
        setFlights([]);
        setLoading(false);
        setError(null);
        return;
      }

      clearScheduledRefresh();
      cancelRequest();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const response = await getLiveFlights(bbox, {
          signal: controller.signal,
        });

        console.log("DEBUG /api/flights/live raw response:", response);

        const states = Array.isArray(response?.states) ? response.states : [];

        setFlights(states);
        setCreditsRemaining(response?.credits_remaining ?? null);
        setNextRefreshSeconds(
          Number.isFinite(response?.next_refresh_s) ? response.next_refresh_s : 15
        );
        setLastUpdatedAt(formatTime(new Date()));
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("ERROR useLiveFlights.fetchFlights:", requestError);

        setFlights([]);
        setError(requestError?.message || "No se pudieron cargar los vuelos.");
      } finally {
        setLoading(false);
        abortControllerRef.current = null;

        if (enabled && !document.hidden) {
          const refreshMs = Math.max(nextRefreshSeconds || 15, 5) * 1000;

          timeoutRef.current = window.setTimeout(() => {
            fetchFlights();
          }, refreshMs);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearScheduledRefresh();
        cancelRequest();
        return;
      }

      fetchFlights();
    }

    fetchFlights();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearScheduledRefresh();
      cancelRequest();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [bbox, bboxKey, enabled, nextRefreshSeconds]);

  return {
    flights,
    error,
    loading,
    lastUpdatedAt,
    creditsRemaining,
    nextRefreshSeconds,
  };
}