export async function favoritesRequest(path, { token, method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "Error con favoritos.");
  }
  return data;
}

export function fetchFavorites(token) {
  return favoritesRequest("/api/favorites", { token });
}

export function addFavorite(token, payload) {
  return favoritesRequest("/api/favorites", { token, method: "POST", body: payload });
}

export function removeFavorite(token, icao24) {
  return favoritesRequest(`/api/favorites/${encodeURIComponent(icao24)}`, {
    token,
    method: "DELETE",
  });
}
