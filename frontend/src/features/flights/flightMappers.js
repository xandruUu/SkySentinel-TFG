function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringOrEmpty(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeIcao24(value) {
  return toStringOrEmpty(value).toLowerCase();
}

function normalizeCallsign(value) {
  return toStringOrEmpty(value).toUpperCase();
}

function normalizeCountry(value) {
  return toStringOrEmpty(value);
}

function buildFlightId(rawFlight) {
  const icao24 = normalizeIcao24(rawFlight?.icao24);
  const callsign = normalizeCallsign(rawFlight?.callsign);

  if (icao24) return `icao24:${icao24}`;
  if (callsign) return `callsign:${callsign}`;

  return `unknown:${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeFlight(rawFlight) {
  const longitude = toNumberOrNull(rawFlight?.longitude);
  const latitude = toNumberOrNull(rawFlight?.latitude);

  return {
    id: buildFlightId(rawFlight),
    icao24: normalizeIcao24(rawFlight?.icao24),
    callsign: normalizeCallsign(rawFlight?.callsign),
    originCountry: normalizeCountry(rawFlight?.origin_country),
    longitude,
    latitude,
    baroAltitude: toNumberOrNull(rawFlight?.baro_altitude),
    velocity: toNumberOrNull(rawFlight?.velocity),
    trueTrack: toNumberOrNull(rawFlight?.true_track),
    verticalRate: toNumberOrNull(rawFlight?.vertical_rate),
    onGround: Boolean(rawFlight?.on_ground),
    lastContact: toNumberOrNull(rawFlight?.last_contact),
    raw: rawFlight,
  };
}

export function normalizeFlights(rawFlights) {
  if (!Array.isArray(rawFlights)) {
    return [];
  }

  return rawFlights
    .map(normalizeFlight)
    .filter((flight) => flight.longitude !== null && flight.latitude !== null);
}

export function matchesFlightSearch(flight, searchTerm) {
  const normalizedSearch = toStringOrEmpty(searchTerm).toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableText = [
    flight.icao24,
    flight.callsign,
    flight.originCountry,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

export function filterFlights(flights, filters) {
  const {
    search = "",
    hideOnGround = false,
    onlyFavorites = false,
    favoritesSet = new Set(),
  } = filters ?? {};

  return flights.filter((flight) => {
    if (hideOnGround && flight.onGround) {
      return false;
    }

    if (onlyFavorites && !favoritesSet.has(flight.icao24)) {
      return false;
    }

    if (!matchesFlightSearch(flight, search)) {
      return false;
    }

    return true;
  });
}

export function flightsToGeoJson(flights) {
  return {
    type: "FeatureCollection",
    features: flights.map((flight) => ({
      type: "Feature",
      id: flight.id,
      geometry: {
        type: "Point",
        coordinates: [flight.longitude, flight.latitude],
      },
      properties: {
        id: flight.id,
        icao24: flight.icao24,
        callsign: flight.callsign,
        originCountry: flight.originCountry,
        baroAltitude: flight.baroAltitude,
        velocity: flight.velocity,
        trueTrack: flight.trueTrack,
        verticalRate: flight.verticalRate,
        onGround: flight.onGround,
        lastContact: flight.lastContact,
      },
    })),
  };
}