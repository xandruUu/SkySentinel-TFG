import { useContext } from "react";
import { FavoritesContext } from "./favoritesContext.js";

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>.");
  return ctx;
}
