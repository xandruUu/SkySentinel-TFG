import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useLiveFlights } from "../../features/flights/useLiveFlights.js";
import avionMarker from "../../assets/avion1.png";

const MADRID_BOUNDS = {
  lamin: 40.0,
  lomin: -4.5,
  lamax: 41.5,
  lomax: -2.5,
};

const MADRID_CENTER = [-3.7038, 40.4168];

const AIRCRAFT_SOURCE_ID = "aircraft";
const SELECTED_SOURCE_ID = "selected-aircraft";
const AIRCRAFT_LAYER_ID = "aircraft-symbols";
const SELECTED_LAYER_ID = "selected-aircraft-halo";
const AIRCRAFT_IMAGE_ID = "aircraft-marker-image";

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}

function buildRasterStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  };
}

function normalizeState(rawState) {
  if (!rawState) return null;

  if (!Array.isArray(rawState)) {
    const longitude = rawState.longitude;
    const latitude = rawState.latitude;

    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return null;
    }

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
      model: rawState.model ?? null,
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
    last_contact: rawState[4] ?? null,
    spi: rawState[15] ?? null,
    squawk: rawState[14] ?? null,
    position_source: rawState[16] ?? null,
  };
}

function formatTime(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString();
}

function formatSpeed(ms) {
  if (typeof ms !== "number") return "—";
  return `${Math.round(ms * 3.6)} km/h`;
}

function formatAltitude(meters) {
  if (typeof meters !== "number") return "—";
  return `${Math.round(meters)} m`;
}

function formatTrack(track) {
  if (typeof track !== "number") return "—";
  return `${Math.round(track)}°`;
}

function formatCoord(value) {
  if (typeof value !== "number") return "—";
  return value.toFixed(4);
}

function formatPositionSource(value) {
  if (value === 0) return "ADS-B";
  if (value === 1) return "ASTERIX";
  if (value === 2) return "MLAT";
  return "—";
}

function buildPopupHtml(aircraft) {
  return `
    <div style="
      min-width:170px;
      font-family:Inter,Arial,sans-serif;
      text-align:center;
      padding:4px 2px;
    ">
      <div style="
        font-size:22px;
        font-weight:900;
        color:#2563eb;
        letter-spacing:1px;
        line-height:1.1;
      ">
        ${aircraft.callsign?.trim() || aircraft.icao24 || "—"}
      </div>

      <div style="
        margin-top:4px;
        font-size:13px;
        color:#64748b;
        font-weight:600;
      ">
        ${aircraft.model || "Modelo desconocido"}
      </div>
    </div>
  `;
}

function toFeatureCollection(states, filters) {
  const {
    query,
    hideGround,
    onlyInAir,
    onlyWithCallsign,
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
      if (onlyWithCallsign && !aircraft.callsign) return false;

      if (country.trim()) {
        const aircraftCountry = (aircraft.origin_country || "").toLowerCase();
        if (!aircraftCountry.includes(country.trim().toLowerCase())) return false;
      }

      const altitude = aircraft.geo_altitude ?? aircraft.baro_altitude;
      if (typeof altitude === "number") {
        if (hasMinAltitude && altitude < parsedMinAltitude) return false;
        if (hasMaxAltitude && altitude > parsedMaxAltitude) return false;
      }

      if (typeof aircraft.velocity === "number") {
        if (hasMinSpeed && aircraft.velocity < parsedMinSpeed) return false;
        if (hasMaxSpeed && aircraft.velocity > parsedMaxSpeed) return false;
      }

      if (q) {
        const haystack =
          `${aircraft.icao24} ${aircraft.callsign} ${aircraft.origin_country} ${aircraft.model || ""}`.toLowerCase();

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

function emptyFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

function FiltersPanel({
  filters,
  setFilters,
  data,
  mapError,
  error,
  loading,
  lastUpdatedAt,
  visibleAircraftCount,
  selectedId,
  iconLoaded,
}) {
  return (
    <div className="w-full rounded-3xl bg-white/92 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>

      <div className="mt-1 text-sm text-slate-500">
        {data?.aircraft_count ?? 0} aviones · créditos {data?.credits_remaining ?? "—"} · refresh 15s
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">Buscar</label>
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder="callsign, icao24, país..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">País</label>
          <input
            value={filters.country}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, country: event.target.value }))
            }
            placeholder="Spain, France, Germany..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">Altitud mín.</label>
            <input
              type="number"
              value={filters.minAltitude}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, minAltitude: event.target.value }))
              }
              placeholder="sin mínimo"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">Altitud máx.</label>
            <input
              type="number"
              value={filters.maxAltitude}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, maxAltitude: event.target.value }))
              }
              placeholder="sin máximo"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">Velocidad mín.</label>
            <input
              type="number"
              value={filters.minSpeed}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, minSpeed: event.target.value }))
              }
              placeholder="sin mínimo"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">Velocidad máx.</label>
            <input
              type="number"
              value={filters.maxSpeed}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, maxSpeed: event.target.value }))
              }
              placeholder="sin máximo"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>
        </div>

        <label className="flex items-center justify-between text-sm text-slate-800">
          <span>Ocultar en tierra</span>
          <input
            type="checkbox"
            checked={filters.hideGround}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, hideGround: event.target.checked }))
            }
          />
        </label>

        <label className="flex items-center justify-between text-sm text-slate-800">
          <span>Solo en vuelo</span>
          <input
            type="checkbox"
            checked={filters.onlyInAir}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, onlyInAir: event.target.checked }))
            }
          />
        </label>

        <label className="flex items-center justify-between text-sm text-slate-800">
          <span>Solo con callsign</span>
          <input
            type="checkbox"
            checked={filters.onlyWithCallsign}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, onlyWithCallsign: event.target.checked }))
            }
          />
        </label>

        <button
          type="button"
          onClick={() =>
            setFilters({
              query: "",
              hideGround: false,
              onlyInAir: false,
              onlyWithCallsign: false,
              country: "",
              minAltitude: "",
              maxAltitude: "",
              minSpeed: "",
              maxSpeed: "",
            })
          }
          className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
        >
          Resetear filtros
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
        <div><strong>Error mapa:</strong> {mapError || "ninguno"}</div>
        <div><strong>Error API:</strong> {error || "ninguno"}</div>
        <div><strong>Loading:</strong> {loading ? "sí" : "no"}</div>
        <div><strong>Última actualización:</strong> {formatTime(lastUpdatedAt)}</div>
        <div><strong>Aviones visibles:</strong> {visibleAircraftCount}</div>
        <div><strong>Seleccionado:</strong> {selectedId || "ninguno"}</div>
        <div><strong>Icono:</strong> {iconLoaded ? "cargado" : "pendiente"}</div>
      </div>
    </div>
  );
}

function SelectionCard({ aircraft, expanded, setExpanded, onClose }) {
  if (!aircraft) return null;

  const compactSummary = `${aircraft.on_ground ? "En tierra" : "En vuelo"} · ${formatSpeed(
    aircraft.velocity
  )} · ${formatAltitude(aircraft.geo_altitude ?? aircraft.baro_altitude)}`;

  return (
    <div
      className="
        absolute z-20
        left-3 right-3 bottom-4
        md:left-auto md:right-4 md:bottom-4 md:w-[380px] md:max-w-[calc(100vw-2rem)]
      "
    >
      <div
        className={`
          rounded-3xl bg-white/95 p-4 shadow-2xl ring-1 ring-slate-200 backdrop-blur
          ${expanded ? "max-h-[52dvh] overflow-y-auto" : "overflow-hidden"}
          md:max-h-none
        `}
      >
        <div className="mb-3 flex justify-center md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold text-primary">
              {aircraft.callsign || "Sin callsign"}
            </h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              ICAO24 · {aircraft.icao24 || "—"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              Modelo · {aircraft.model || "Desconocido"}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 md:hidden"
            >
              {expanded ? "Ver menos" : "Ver más"}
            </button>

            <button
              onClick={onClose}
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        {!expanded ? (
          <div className="pt-3">
            <p className="text-sm font-semibold text-slate-800">{compactSummary}</p>
            <p className="mt-2 text-xs text-slate-500">
              {formatCoord(aircraft.latitude)}, {formatCoord(aircraft.longitude)}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="font-bold text-slate-700">País</p>
              <p className="break-words text-slate-900">{aircraft.origin_country || "—"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Estado</p>
              <p className="text-slate-900">{aircraft.on_ground ? "En tierra" : "En vuelo"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Velocidad</p>
              <p className="text-slate-900">{formatSpeed(aircraft.velocity)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Rumbo</p>
              <p className="text-slate-900">{formatTrack(aircraft.true_track)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Altitud geo</p>
              <p className="text-slate-900">{formatAltitude(aircraft.geo_altitude)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Altitud baro</p>
              <p className="text-slate-900">{formatAltitude(aircraft.baro_altitude)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Latitud</p>
              <p className="text-slate-900">{formatCoord(aircraft.latitude)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Longitud</p>
              <p className="text-slate-900">{formatCoord(aircraft.longitude)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Squawk</p>
              <p className="text-slate-900">{aircraft.squawk || "—"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">SPI</p>
              <p className="text-slate-900">{aircraft.spi ? "Sí" : "No"}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Fuente posición</p>
              <p className="text-slate-900">{formatPositionSource(aircraft.position_source)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Último contacto</p>
              <p className="text-slate-900">{formatTime(aircraft.last_contact)}</p>
            </div>

            <div className="col-span-2">
              <p className="font-bold text-slate-700">Resumen</p>
              <p className="text-slate-900">
                {aircraft.callsign || aircraft.icao24 || "Aeronave"} ·{" "}
                {aircraft.on_ground ? "en tierra" : "en vuelo"} ·{" "}
                {formatSpeed(aircraft.velocity)} · rumbo {formatTrack(aircraft.true_track)} ·
                altitud {formatAltitude(aircraft.geo_altitude ?? aircraft.baro_altitude)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [iconLoaded, setIconLoaded] = useState(false);
  const [mapError, setMapError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(!isMobileViewport());

  const [filters, setFilters] = useState({
    query: "",
    hideGround: false,
    onlyInAir: false,
    onlyWithCallsign: false,
    country: "",
    minAltitude: "",
    maxAltitude: "",
    minSpeed: "",
    maxSpeed: "",
  });

  const { data, error, loading, lastUpdatedAt } = useLiveFlights({
    bounds: MADRID_BOUNDS,
    refreshMs: 15000,
    enabled: true,
  });

  const rawStates = data?.states || [];

  const geojson = useMemo(() => {
    return toFeatureCollection(rawStates, filters);
  }, [rawStates, filters]);

  const selectedFeatureCollection = useMemo(() => {
    if (!selectedId) return emptyFeatureCollection();

    const selectedFeature = geojson.features.find(
      (feature) => feature.properties?.icao24 === selectedId
    );

    return selectedFeature
      ? { type: "FeatureCollection", features: [selectedFeature] }
      : emptyFeatureCollection();
  }, [geojson, selectedId]);

  const selectedAircraft = selectedFeatureCollection.features[0]?.properties || null;

  useEffect(() => {
    if (selectedAircraft) {
      setCardExpanded(!isMobileViewport());
    }
  }, [selectedAircraft]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildRasterStyle(),
      center: MADRID_CENTER,
      zoom: 7,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const closePopup = () => {
      popupRef.current?.remove();
      popupRef.current = null;
    };

    const focusAircraft = (coordinates) => {
      const mobile = isMobileViewport();

      map.easeTo({
        center: coordinates,
        zoom: Math.max(map.getZoom(), mobile ? 8 : 8.2),
        duration: 450,
        essential: true,
        padding: mobile
          ? { top: 90, right: 20, bottom: 250, left: 20 }
          : { top: 40, right: 430, bottom: 40, left: 40 },
      });
    };

    const onAircraftClick = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const aircraft = feature.properties || {};
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates) return;

      setSelectedId(aircraft.icao24 || null);
      setCardExpanded(!isMobileViewport());
      closePopup();

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        maxWidth: "300px",
      })
        .setLngLat(coordinates)
        .setHTML(buildPopupHtml(aircraft))
        .addTo(map);

      popupRef.current = popup;
      focusAircraft(coordinates);
    };

    map.on("load", () => {
      setMapLoaded(true);
      setMapError("");

      map.addSource(AIRCRAFT_SOURCE_ID, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });

      map.addSource(SELECTED_SOURCE_ID, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });

      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        if (!map.hasImage(AIRCRAFT_IMAGE_ID)) {
          map.addImage(AIRCRAFT_IMAGE_ID, image);
        }

        setIconLoaded(true);

        map.addLayer({
          id: SELECTED_LAYER_ID,
          type: "circle",
          source: SELECTED_SOURCE_ID,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6, 10,
              8, 13,
              10, 16,
              12, 20,
            ],
            "circle-color": "#f97316",
            "circle-opacity": 0.18,
            "circle-stroke-color": "#ea580c",
            "circle-stroke-width": 2,
          },
        });

        map.addLayer({
          id: AIRCRAFT_LAYER_ID,
          type: "symbol",
          source: AIRCRAFT_SOURCE_ID,
          layout: {
            "icon-image": AIRCRAFT_IMAGE_ID,
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6, 0.04,
              8, 0.05,
              10, 0.06,
              12, 0.075,
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-anchor": "center",
            "icon-rotate": ["coalesce", ["get", "true_track"], 0],
            "icon-rotation-alignment": "map",
          },
        });

        map.on("click", AIRCRAFT_LAYER_ID, onAircraftClick);

        map.on("mouseenter", AIRCRAFT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", AIRCRAFT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
      };

      image.onerror = () => {
        setMapError("No se pudo cargar avion1.png");
      };

      image.src = avionMarker;
    });

    map.on("click", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [AIRCRAFT_LAYER_ID],
      });

      if (features.length === 0) {
        setSelectedId(null);
        closePopup();
      }
    });

    map.on("error", (event) => {
      setMapError(event?.error?.message || "Error cargando el mapa base.");
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const aircraftSource = map.getSource(AIRCRAFT_SOURCE_ID);
    const selectedSource = map.getSource(SELECTED_SOURCE_ID);

    if (aircraftSource) {
      aircraftSource.setData(geojson);
    }

    if (selectedSource) {
      selectedSource.setData(selectedFeatureCollection);
    }
  }, [geojson, selectedFeatureCollection, mapLoaded]);

  useEffect(() => {
    if (selectedFeatureCollection.features.length > 0) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, [selectedFeatureCollection]);

  const visibleAircraftCount = geojson.features.length;

  return (
    <div className="relative bg-slate-100">
      <div
        ref={mapContainerRef}
        className="h-[calc(100dvh-112px)] min-h-[620px] w-full"
      />

      <div className="absolute left-4 top-4 z-10 hidden w-[360px] max-w-[calc(100vw-2rem)] md:block">
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          data={data}
          mapError={mapError}
          error={error}
          loading={loading}
          lastUpdatedAt={lastUpdatedAt}
          visibleAircraftCount={visibleAircraftCount}
          selectedId={selectedId}
          iconLoaded={iconLoaded}
        />
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        className="absolute left-4 top-4 z-30 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-xl ring-1 ring-primary/20 md:hidden"
      >
        Filtros
      </button>

      {filtersOpen && (
        <div className="absolute inset-0 z-40 bg-black/35 backdrop-blur-[2px] md:hidden">
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-primary">Filtros</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200"
              >
                Cerrar
              </button>
            </div>

            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              data={data}
              mapError={mapError}
              error={error}
              loading={loading}
              lastUpdatedAt={lastUpdatedAt}
              visibleAircraftCount={visibleAircraftCount}
              selectedId={selectedId}
              iconLoaded={iconLoaded}
            />
          </div>
        </div>
      )}

      <SelectionCard
        aircraft={selectedAircraft}
        expanded={cardExpanded}
        setExpanded={setCardExpanded}
        onClose={() => {
          setSelectedId(null);
          popupRef.current?.remove();
          popupRef.current = null;
        }}
      />
    </div>
  );
}