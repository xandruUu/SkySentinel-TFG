import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth.js";

async function parseJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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
  const { token, isAuthenticated } = useAuth();

  const [storedFavorites, setStoredFavorites] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const favorites = useMemo(() => {
    return isAuthenticated ? storedFavorites : [];
  }, [isAuthenticated, storedFavorites]);

  const favoritesSet = useMemo(() => {
    return new Set(favorites.map((favorite) => favorite.icao24));
  }, [favorites]);

  const reload = useCallback(async () => {
    if (!token) {
      setStoredFavorites([]);
      return [];
    }

    const nextFavorites = await fetchFavoritesRequest(token);
    setStoredFavorites(nextFavorites);
    setError(null);
    return nextFavorites;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStoredFavorites([]);
      setError(null);
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

      const key = String(icao24 || "").trim().toLowerCase();
      if (key.length !== 6) {
        throw new Error("icao24 inválido");
      }

      const isFavorite = favoritesSet.has(key);
      setBusy(true);

      try {
        const response = await fetch(`/api/favorites/${encodeURIComponent(key)}`, {
          method: isFavorite ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const payload = await parseJsonSafely(response);
          throw new Error(payload?.detail || `HTTP ${response.status}`);
        }

        await reload();
      } finally {
        setBusy(false);
      }
    },
    [token, favoritesSet, reload]
  );

  return {
    favorites,
    favoritesSet,
    toggleFavorite,
    reload,
    error,
    busy,
  };
}