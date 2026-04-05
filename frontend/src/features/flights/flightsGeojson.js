export function toAircraftFeatureCollection({ flightsResponse, favoritesSet, filters }) {
  const states = flightsResponse?.states || [];

  const q = (filters.query || "").trim().toLowerCase();
  const favoritesOnly = Boolean(filters.favoritesOnly);
  const hideGround = Boolean(filters.hideGround);

  const features = [];

  for (const s of states) {
    const icao24 = (s.icao24 || "").toLowerCase();
    const callsign = (s.callsign || "").trim();

    const lon = s.longitude;
    const lat = s.latitude;
    if (typeof lon !== "number" || typeof lat !== "number") continue;

    const fav = favoritesSet.has(icao24);

    if (favoritesOnly && !fav) continue;
    if (hideGround && s.on_ground) continue;

    if (q) {
      const hay = `${icao24} ${callsign}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }

    features.push({
      type: "Feature",
      id: icao24,
      properties: {
        ...s,
        icao24,
        callsign,
        is_favorite: fav,
      },
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
