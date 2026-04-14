import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useLiveFlights } from "../../features/flights/useLiveFlights.js";
import avionMarker from "../../assets/avion.png";

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

function buildPopupHtml(aircraft) {
  return `
    <div style="min-width:250px;max-width:300px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:16px;font-weight:800;color:#1e3a8a;">
          ${aircraft.callsign || "Sin callsign"}
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">
          ICAO24 · ${aircraft.icao24 || "—"}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:13px;">
        <div>
          <div style="font-weight:700;color:#334155;">País</div>
          <div>${aircraft.origin_country || "—"}</div>
        </div>

        <div>
          <div style="font-weight:700;color:#334155;">Estado</div>
          <div>${aircraft.on_ground ? "En tierra" : "En vuelo"}</div>
        </div>

        <div>
          <div style="font-weight:700;color:#334155;">Velocidad</div>
          <div>${formatSpeed(aircraft.velocity)}</div>
        </div>

        <div>
          <div style="font-weight:700;color:#334155;">Rumbo</div>
          <div>${formatTrack(aircraft.true_track)}</div>
        </div>

        <div>
          <div style="font-weight:700;color:#334155;">Altitud geo</div>
          <div>${formatAltitude(aircraft.geo_altitude)}</div>
        </div>

        <div>
          <div style="font-weight:700;color:#334155;">Altitud baro</div>
          <div>${formatAltitude(aircraft.baro_altitude)}</div>
        </div>
      </div>
    </div>
  `;
}

function toFeatureCollection(states, search, hideGround) {
  const query = String(search || "").trim().toLowerCase();

  const features = (states || [])
    .map(normalizeState)
    .filter(Boolean)
    .filter((aircraft) => {
      if (hideGround && aircraft.on_ground) return false;

      if (!query) return true;

      const haystack =
        `${aircraft.icao24} ${aircraft.callsign} ${aircraft.origin_country}`.toLowerCase();

      return haystack.includes(query);
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

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [iconLoaded, setIconLoaded] = useState(false);
  const [mapError, setMapError] = useState("");
  const [search, setSearch] = useState("");
  const [hideGround, setHideGround] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const { data, error, loading, lastUpdatedAt } = useLiveFlights({
    bounds: MADRID_BOUNDS,
    refreshMs: 15000,
    enabled: true,
  });

  const rawStates = data?.states || [];

  const geojson = useMemo(() => {
    return toFeatureCollection(rawStates, search, hideGround);
  }, [rawStates, search, hideGround]);

  const selectedFeatureCollection = useMemo(() => {
    if (!selectedId) return emptyFeatureCollection();

    const selectedFeature = geojson.features.find(
      (feature) => feature.properties?.icao24 === selectedId
    );

    return selectedFeature
      ? { type: "FeatureCollection", features: [selectedFeature] }
      : emptyFeatureCollection();
  }, [geojson, selectedId]);

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

    const onAircraftClick = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const aircraft = feature.properties || {};
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates) return;

      setSelectedId(aircraft.icao24 || null);
      closePopup();

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 18,
        maxWidth: "320px",
      })
        .setLngLat(coordinates)
        .setHTML(buildPopupHtml(aircraft))
        .addTo(map);

      popup.on("close", () => {
        popupRef.current = null;
        setSelectedId(null);
      });

      popupRef.current = popup;

      map.easeTo({
        center: coordinates,
        duration: 350,
        essential: true,
      });
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
            "circle-radius": 16,
            "circle-color": "#f97316",
            "circle-opacity": 0.22,
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
            "icon-size": 0.055,
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
        setMapError("No se pudo cargar avion.png");
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
      closePopup();
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

      <div className="absolute left-4 top-4 z-10 w-[360px] rounded-3xl bg-white/92 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>

        <div className="mt-1 text-sm text-slate-500">
          {data?.aircraft_count ?? 0} aviones · créditos {data?.credits_remaining ?? "—"} · refresh 15s
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              Buscar (callsign o icao24)
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="IBE, RYR, 3c6444..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <label className="flex items-center justify-between text-sm text-slate-800">
            <span>Ocultar en tierra</span>
            <input
              type="checkbox"
              checked={hideGround}
              onChange={(event) => setHideGround(event.target.checked)}
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          <div><strong>Mapa cargado:</strong> {mapLoaded ? "sí" : "no"}</div>
          <div><strong>Icono cargado:</strong> {iconLoaded ? "sí" : "no"}</div>
          <div><strong>Error mapa:</strong> {mapError || "ninguno"}</div>
          <div><strong>Error API:</strong> {error || "ninguno"}</div>
          <div><strong>Loading:</strong> {loading ? "sí" : "no"}</div>
          <div><strong>Última actualización:</strong> {formatTime(lastUpdatedAt)}</div>
          <div><strong>Estados recibidos:</strong> {rawStates.length}</div>
          <div><strong>Puntos pintados:</strong> {visibleAircraftCount}</div>
          <div><strong>Seleccionado:</strong> {selectedId || "ninguno"}</div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <div className="rounded-2xl bg-white/85 px-4 py-2 text-xs text-slate-600 shadow ring-1 ring-slate-200">
          Diagnóstico mapa · popup limpio · halo estable
        </div>
      </div>
    </div>
  );
}