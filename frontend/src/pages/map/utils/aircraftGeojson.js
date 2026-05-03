export function normalizeState(rawState) {
  if (!rawState) return null;

  if (!Array.isArray(rawState)) {
    const { longitude, latitude } = rawState;

    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return null;
    }

    const model = rawState.model ?? rawState.aircraft_model ?? null;

    return {
      icao24: String(rawState.icao24 || "").toLowerCase(),
      callsign: String(rawState.callsign || "").trim(),
      origin_country: rawState.origin_country || "",
      longitude,
      latitude,
      velocity: rawState.velocity ?? null,
      true_track: rawState.true_track ?? null,
      on_ground: Boolean(rawState.on_ground),
      baro_altitude: rawState.baro_altitude ?? null,
      geo_altitude: rawState.geo_altitude ?? null,
      model,
      aircraft_model: model,
      operator_company: rawState.operator_company ?? null,
      registration: rawState.registration ?? null,
      last_contact: rawState.last_contact ?? null,
      spi: rawState.spi ?? null,
      squawk: rawState.squawk ?? null,
      position_source: rawState.position_source ?? null,
    };
  }

  const longitude = rawState[5];
  const latitude = rawState[6];

  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return null;
  }

  return {
    icao24: String(rawState[0] || "").toLowerCase(),
    callsign: String(rawState[1] || "").trim(),
    origin_country: rawState[2] || "",
    longitude,
    latitude,
    velocity: rawState[9] ?? null,
    true_track: rawState[10] ?? null,
    on_ground: Boolean(rawState[8]),
    baro_altitude: rawState[7] ?? null,
    geo_altitude: rawState[13] ?? null,
    model: null,
    aircraft_model: null,
    operator_company: null,
    registration: null,
    last_contact: rawState[4] ?? null,
    spi: rawState[15] ?? null,
    squawk: rawState[14] ?? null,
    position_source: rawState[16] ?? null,
  };
}

export function toFeatureCollection(states, filters) {
  const {
    query,
    hideGround,
    onlyInAir,
    country,
    minAltitude,
    maxAltitude,
    minSpeed,
    maxSpeed,
  } = filters;

  const q = String(query || "").trim().toLowerCase();

  const parsedMinAltitude = Number(minAltitude);
  const parsedMaxAltitude = Number(maxAltitude);
  const parsedMinSpeed = Number(minSpeed);
  const parsedMaxSpeed = Number(maxSpeed);

  const hasMinAltitude = Number.isFinite(parsedMinAltitude) && minAltitude !== "";
  const hasMaxAltitude = Number.isFinite(parsedMaxAltitude) && maxAltitude !== "";
  const hasMinSpeed = Number.isFinite(parsedMinSpeed) && minSpeed !== "";
  const hasMaxSpeed = Number.isFinite(parsedMaxSpeed) && maxSpeed !== "";

  const features = (states || [])
    .map(normalizeState)
    .filter(Boolean)
    .filter((aircraft) => {
      if (hideGround && aircraft.on_ground) return false;
      if (onlyInAir && aircraft.on_ground) return false;

      if (country) {
        const aircraftCountry = (aircraft.origin_country || "").toLowerCase();

        if (aircraftCountry !== country.toLowerCase()) {
          return false;
        }
      }

      const altitude = aircraft.geo_altitude ?? aircraft.baro_altitude;

      if (typeof altitude === "number") {
        if (hasMinAltitude && altitude < parsedMinAltitude) return false;
        if (hasMaxAltitude && altitude > parsedMaxAltitude) return false;
      }

      if (typeof aircraft.velocity === "number") {
        const speedKmh = aircraft.velocity * 3.6;

        if (hasMinSpeed && speedKmh < parsedMinSpeed) return false;
        if (hasMaxSpeed && speedKmh > parsedMaxSpeed) return false;
      }

      if (q) {
        const haystack = `${aircraft.icao24} ${aircraft.callsign} ${
          aircraft.registration || ""
        }`.toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    })
    .map((aircraft) => ({
      type: "Feature",
      id: aircraft.icao24,
      properties: aircraft,
      geometry: {
        type: "Point",
        coordinates: [aircraft.longitude, aircraft.latitude],
      },
    }));

  return {
    type: "FeatureCollection",
    features,
  };
}

export function emptyFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: [],
  };
}