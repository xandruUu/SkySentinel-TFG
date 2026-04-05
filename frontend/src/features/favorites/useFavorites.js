import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth.js";

async function fetchFavoritesRequest(token, signal) {
  const response = await fetch("/api/favorites", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  return data.map((item) => ({
    icao24: String(item.icao24 || "").toLowerCase(),
  }));
}

export function useFavorites() {
  const { token } = useAuth();

  const [storedFavorites, setStoredFavorites] = useState([]);
  const [error, setError] = useState(null);

  const favorites = useMemo(() => {
    return token ? storedFavorites : [];
  }, [token, storedFavorites]);

  const favoritesSet = useMemo(() => {
    return new Set(favorites.map((f) => f.icao24));
  }, [favorites]);

  const reload = useCallback(async () => {
    if (!token) {
      return [];
    }

    const nextFavorites = await fetchFavoritesRequest(token);
    setStoredFavorites(nextFavorites);
    setError(null);
    return nextFavorites;
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const nextFavorites = await fetchFavoritesRequest(
          token,
          controller.signal
        );

        if (cancelled) return;

        setStoredFavorites(nextFavorites);
        setError(null);
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;

        setError(err?.message || "No se pudieron cargar los favoritos.");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token]);

  const toggleFavorite = useCallback(
    async (icao24) => {
      if (!token) return;

      const key = String(icao24 || "").toLowerCase().trim();
      const isFavorite = favoritesSet.has(key);

      const response = await fetch(`/api/favorites/${encodeURIComponent(key)}`, {
        method: isFavorite ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await reload();
    },
    [token, favoritesSet, reload]
  );

  return {
    favorites,
    favoritesSet,
    toggleFavorite,
    reload,
    error,
  };
}