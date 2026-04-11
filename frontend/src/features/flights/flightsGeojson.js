export function toAircraftFeatureCollection({ flightsResponse, filters }) {
  const states = flightsResponse?.states || [];

  const q = (filters.query || "").trim().toLowerCase();
  const hideGround = Boolean(filters.hideGround);

  const features = [];

  for (const s of states) {
    const icao24 = (s.icao24 || "").toLowerCase();
    const callsign = (s.callsign || "").trim();

    const lon = s.longitude;
    const lat = s.latitude;

    if (typeof lon !== "number" || typeof lat !== "number") {
      continue;
    }

    if (hideGround && s.on_ground) {
      continue;
    }

    if (q) {
      const hay = `${icao24} ${callsign}`.toLowerCase();
      if (!hay.includes(q)) {
        continue;
      }
    }

    features.push({
      type: "Feature",
      id: icao24,
      properties: {
        ...s,
        icao24,
        callsign,
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