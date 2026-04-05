import { useCallback, useEffect, useMemo, useState } from "react";
import { FavoritesContext } from "./favoritesContext.js";
import { addFavorite, fetchFavorites, removeFavorite } from "./favoritesApi.js";
import { useAuth } from "../auth/useAuth.js";

export function FavoritesProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]); // [{icao24,callsign,created_at}]
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchFavorites(token);
      setFavorites(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const favoritesSet = useMemo(() => new Set(favorites.map((f) => f.icao24)), [favorites]);

  const isFavorite = useCallback((icao24) => favoritesSet.has((icao24 || "").toLowerCase()), [favoritesSet]);

  const toggleFavorite = useCallback(
    async ({ icao24, callsign }) => {
      if (!token) return;

      const key = (icao24 || "").toLowerCase();
      const already = favoritesSet.has(key);

      // optimistic update
      setFavorites((prev) =>
        already ? prev.filter((x) => x.icao24 !== key) : [{ icao24: key, callsign: callsign || null, created_at: new Date().toISOString() }, ...prev]
      );

      try {
        if (already) {
          await removeFavorite(token, key);
        } else {
          await addFavorite(token, { icao24: key, callsign: callsign || null });
        }
      } catch (e) {
        // rollback: re-sync
        await refresh();
        throw e;
      }
    },
    [token, favoritesSet, refresh]
  );

  const value = useMemo(
    () => ({ favorites, loading, refresh, isFavorite, toggleFavorite }),
    [favorites, loading, refresh, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
