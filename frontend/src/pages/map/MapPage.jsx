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
const AIRCRAFT_LAYER_ID = "aircraft-symbols";
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
    const icao24 = String(rawState.icao24 || "").toLowerCase();
    const longitude = rawState.longitude;
    const latitude = rawState.latitude;

    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return null;
    }

    return {
      icao24,
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

function toFeatureCollection(states, search, hideGround) {
  const q = String(search || "").trim().toLowerCase();

  const features = (states || [])
    .map(normalizeState)
    .filter(Boolean)
    .filter((aircraft) => {
      if (hideGround && aircraft.on_ground) return false;

      if (!q) return true;

      const haystack =
        `${aircraft.icao24} ${aircraft.callsign} ${aircraft.origin_country}`.toLowerCase();

      return haystack.includes(q);
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

function formatTime(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString();
}

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState("");
  const [search, setSearch] = useState("");
  const [hideGround, setHideGround] = useState(true);

  const [iconLoaded, setIconLoaded] = useState(false);
  const [layerReady, setLayerReady] = useState(false);

  const { data, error, loading, lastUpdatedAt } = useLiveFlights({
    bounds: MADRID_BOUNDS,
    refreshMs: 15000,
    enabled: true,
  });

  const rawStates = data?.states || [];

  const geojson = useMemo(() => {
    return toFeatureCollection(rawStates, search, hideGround);
  }, [rawStates, search, hideGround]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildRasterStyle(),
      center: MADRID_CENTER,
      zoom: 7,
      attributionControl: true,
    });

    const doResize = () => {
      try {
        map.resize();
      } catch {
        // no-op
      }
    };

    const onAircraftClick = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const props = feature.properties || {};
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates) return;

      const html = `
        <div style="min-width:220px;font-family:Arial,sans-serif;">
          <strong>${props.callsign || props.icao24 || "Aircraft"}</strong><br/>
          ICAO24: ${props.icao24 || "—"}<br/>
          País: ${props.origin_country || "—"}<br/>
          Velocidad: ${props.velocity ?? "—"}<br/>
          Rumbo: ${props.true_track ?? "—"}<br/>
          En tierra: ${props.on_ground ? "Sí" : "No"}
        </div>
      `;

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    };

    const onAircraftMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const onAircraftMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const ensureSource = () => {
      if (!map.getSource(AIRCRAFT_SOURCE_ID)) {
        map.addSource(AIRCRAFT_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }
    };

    const ensureLayer = () => {
      if (map.getLayer(AIRCRAFT_LAYER_ID)) {
        setLayerReady(true);
        return;
      }

      map.addLayer({
        id: AIRCRAFT_LAYER_ID,
        type: "symbol",
        source: AIRCRAFT_SOURCE_ID,
        layout: {
          "icon-image": AIRCRAFT_IMAGE_ID,
          "icon-size": 0.07,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-anchor": "center",
          "icon-rotate": ["coalesce", ["get", "true_track"], 0],
          "icon-rotation-alignment": "map",
        },
      });

      map.on("click", AIRCRAFT_LAYER_ID, onAircraftClick);
      map.on("mouseenter", AIRCRAFT_LAYER_ID, onAircraftMouseEnter);
      map.on("mouseleave", AIRCRAFT_LAYER_ID, onAircraftMouseLeave);

      setLayerReady(true);
    };

    const loadAircraftIcon = () => {
      ensureSource();

      if (map.hasImage(AIRCRAFT_IMAGE_ID)) {
        setIconLoaded(true);
        ensureLayer();
        return;
      }

      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        try {
          if (!map.hasImage(AIRCRAFT_IMAGE_ID)) {
            map.addImage(AIRCRAFT_IMAGE_ID, image);
          }

          setIconLoaded(true);
          ensureLayer();
        } catch (iconError) {
          console.error("Error registrando icono:", iconError);
          setMapError("No se pudo registrar el icono del avión.");
        }
      };

      image.onerror = () => {
        console.error("No se pudo cargar avion.png");
        setMapError("No se pudo cargar avion.png");
      };

      image.src = avionMarker;
    };

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
      setMapError("");

      loadAircraftIcon();

      requestAnimationFrame(doResize);
      setTimeout(doResize, 100);
      setTimeout(doResize, 500);
    });

    map.on("error", (event) => {
      const message = event?.error?.message || "Error cargando el mapa base.";
      setMapError(message);
    });

    window.addEventListener("resize", doResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", doResize);

      if (map.getLayer(AIRCRAFT_LAYER_ID)) {
        map.off("click", AIRCRAFT_LAYER_ID, onAircraftClick);
        map.off("mouseenter", AIRCRAFT_LAYER_ID, onAircraftMouseEnter);
        map.off("mouseleave", AIRCRAFT_LAYER_ID, onAircraftMouseLeave);
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource(AIRCRAFT_SOURCE_ID);
    if (!source) return;

    source.setData(geojson);

    try {
      map.resize();
    } catch {
      // no-op
    }
  }, [geojson, mapLoaded]);

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
          <div><strong>Capa icono:</strong> {layerReady ? "sí" : "no"}</div>
          <div><strong>Error mapa:</strong> {mapError || "ninguno"}</div>
          <div><strong>Error API:</strong> {error || "ninguno"}</div>
          <div><strong>Loading:</strong> {loading ? "sí" : "no"}</div>
          <div><strong>Última actualización:</strong> {formatTime(lastUpdatedAt)}</div>
          <div><strong>Estados recibidos:</strong> {rawStates.length}</div>
          <div><strong>Puntos pintados:</strong> {visibleAircraftCount}</div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <div className="rounded-2xl bg-white/85 px-4 py-2 text-xs text-slate-600 shadow ring-1 ring-slate-200">
          Diagnóstico mapa · Madrid fijo · icono avión con rotación
        </div>
      </div>
    </div>
  );
}