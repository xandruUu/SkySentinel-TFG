import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useFavorites } from "../../features/favorites/useFavorites.js";
import { useLiveFlights } from "../../features/flights/useLiveFlights.js";
import {
  DEFAULT_DEMO_BBOX,
  DEFAULT_DEMO_CENTER,
  DEFAULT_DEMO_ZOOM,
  MAP_CIRCLE_LAYER_ID,
  MAP_CIRCLE_STROKE_LAYER_ID,
  MAP_SOURCE_ID,
} from "../../features/flights/mapLayers.js";
import {
  filterFlights,
  flightsToGeoJson,
  normalizeFlights,
} from "../../features/flights/flightMappers.js";

function formatValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return value;
}

function buildPopupHtml(feature) {
  const properties = feature?.properties ?? {};

  return `
    <div style="min-width: 220px;">
      <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">
        ${formatValue(properties.callsign, "Sin callsign")}
      </div>

      <div style="display: grid; gap: 6px; font-size: 14px;">
        <div><strong>ICAO24:</strong> ${formatValue(properties.icao24)}</div>
        <div><strong>País:</strong> ${formatValue(properties.originCountry)}</div>
        <div><strong>Velocidad:</strong> ${formatValue(properties.velocity)}</div>
        <div><strong>Rumbo:</strong> ${formatValue(properties.trueTrack)}</div>
        <div><strong>En tierra:</strong> ${properties.onGround ? "Sí" : "No"}</div>
      </div>
    </div>
  `;
}

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const mountedRef = useRef(false);

  const [search, setSearch] = useState("");
  const [hideOnGround, setHideOnGround] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [mapStatus, setMapStatus] = useState({
    initialized: false,
    loaded: false,
    sourceReady: false,
    error: null,
  });

  const { favoritesSet, error: favoritesError } = useFavorites();

  const {
    flights: rawFlights= [],
    error: flightsError,
    loading,
    lastUpdatedAt,
    creditsRemaining,
    nextRefreshSeconds,
  } = useLiveFlights({
    bbox: DEFAULT_DEMO_BBOX,
  });

  const normalizedFlights = useMemo(() => normalizeFlights(rawFlights), [rawFlights]);

  const visibleFlights = useMemo(() => {
    return filterFlights(normalizedFlights, {
      search,
      hideOnGround,
      onlyFavorites,
      favoritesSet,
    });
  }, [normalizedFlights, search, hideOnGround, onlyFavorites, favoritesSet]);

  const geoJsonData = useMemo(() => flightsToGeoJson(visibleFlights), [visibleFlights]);

  useEffect(() => {
    console.log("DEBUG rawFlights:", rawFlights);
    console.log("DEBUG normalizedFlights:", normalizedFlights);
    console.log("DEBUG visibleFlights:", visibleFlights);
    console.log("DEBUG geoJsonData:", geoJsonData);
    console.log("DEBUG flightsError:", flightsError);
  }, [rawFlights, normalizedFlights, visibleFlights, geoJsonData, flightsError]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || mountedRef.current) {
      return;
    }

    mountedRef.current = true;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: DEFAULT_DEMO_CENTER,
      zoom: DEFAULT_DEMO_ZOOM,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    let cancelled = false;

    const handleLoad = () => {
      if (cancelled) {
        return;
      }

      try {
        map.resize();

        window.setTimeout(() => {
          try {
            map.resize();
          } catch (error) {
            console.error("Error en resize diferido:", error);
          }
        }, 300);

        if (!map.getSource(MAP_SOURCE_ID)) {
          map.addSource(MAP_SOURCE_ID, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });
        }

        if (!map.getLayer(MAP_CIRCLE_STROKE_LAYER_ID)) {
          map.addLayer({
            id: MAP_CIRCLE_STROKE_LAYER_ID,
            type: "circle",
            source: MAP_SOURCE_ID,
            paint: {
              "circle-radius": 10,
              "circle-color": "rgba(37, 99, 235, 0.12)",
            },
          });
        }

        if (!map.getLayer(MAP_CIRCLE_LAYER_ID)) {
          map.addLayer({
            id: MAP_CIRCLE_LAYER_ID,
            type: "circle",
            source: MAP_SOURCE_ID,
            paint: {
              "circle-radius": 7,
              "circle-color": "#2563eb",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        }

        map.on("click", MAP_CIRCLE_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          if (!feature) {
            return;
          }

          if (popupRef.current) {
            popupRef.current.remove();
          }

          popupRef.current = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: "320px",
          })
            .setLngLat(feature.geometry.coordinates)
            .setHTML(buildPopupHtml(feature))
            .addTo(map);
        });

        map.on("mouseenter", MAP_CIRCLE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", MAP_CIRCLE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        setMapStatus({
          initialized: true,
          loaded: true,
          sourceReady: true,
          error: null,
        });
      } catch (error) {
        console.error("Error en handleLoad del mapa:", error);

        setMapStatus({
          initialized: true,
          loaded: false,
          sourceReady: false,
          error: error?.message || "Error al preparar capas del mapa.",
        });
      }
    };

    const handleError = (event) => {
      const message =
        event?.error?.message || "Error desconocido al cargar o renderizar el mapa.";

      console.error("Error de MapLibre:", message, event);

      setMapStatus((prev) => ({
        ...prev,
        error: message,
      }));
    };

    map.on("load", handleLoad);
    map.on("error", handleError);

    mapRef.current = map;

    return () => {
      cancelled = true;

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      map.off("load", handleLoad);
      map.off("error", handleError);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (!map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource(MAP_SOURCE_ID);
    if (!source) {
      return;
    }

    try {
      source.setData(geoJsonData);
    } catch (error) {
      console.error("Error actualizando source GeoJSON:", error);
    }
  }, [geoJsonData]);

  return (
    <div className="relative h-[calc(100dvh-112px)] min-h-[520px] overflow-hidden bg-slate-100">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <aside className="absolute left-4 top-4 z-10 w-[360px] max-w-[calc(100vw-2rem)] rounded-[28px] border border-primary/10 bg-white/92 p-4 shadow-xl backdrop-blur">
        <h2 className="text-2xl font-extrabold text-primary">Filtros</h2>

        <p className="mt-2 text-sm text-slate-500">
          {visibleFlights.length} aviones · créditos {formatValue(creditsRemaining)} · refresh{" "}
          {formatValue(nextRefreshSeconds, 15)}s
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-base font-semibold text-slate-800">
            Buscar (callsign o icao24)
          </label>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="IBE, RYR, 3c6444..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-primary"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="text-base text-slate-800">Solo favoritos</label>
          <input
            type="checkbox"
            checked={onlyFavorites}
            onChange={(event) => setOnlyFavorites(event.target.checked)}
            className="h-5 w-5"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="text-base text-slate-800">Ocultar en tierra</label>
          <input
            type="checkbox"
            checked={hideOnGround}
            onChange={(event) => setHideOnGround(event.target.checked)}
            className="h-5 w-5"
          />
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div>
            <strong>Mapa inicializado:</strong> {mapStatus.initialized ? "sí" : "no"}
          </div>
          <div>
            <strong>Style loaded:</strong> {mapStatus.loaded ? "sí" : "no"}
          </div>
          <div>
            <strong>Source lista:</strong> {mapStatus.sourceReady ? "sí" : "no"}
          </div>
          <div>
            <strong>Error mapa:</strong> {mapStatus.error || "ninguno"}
          </div>
          <div>
            <strong>Error API:</strong> {flightsError || favoritesError || "ninguno"}
          </div>
          <div>
            <strong>Loading:</strong> {loading ? "sí" : "no"}
          </div>
          <div>
            <strong>Última actualización:</strong> {lastUpdatedAt || "—"}
          </div>
          <div>
            <strong>Raw flights:</strong> {Array.isArray(rawFlights) ? rawFlights.length : "no array"}
          </div>
          <div>
            <strong>Estados recibidos:</strong> {normalizedFlights.length}
          </div>
          <div>
            <strong>Puntos pintados:</strong> {visibleFlights.length}
          </div>

          <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-600">
            <strong>Primer vuelo:</strong>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words">
              {rawFlights?.[0] ? JSON.stringify(rawFlights[0], null, 2) : "sin vuelos"}
            </pre>
          </div>
        </div>
      </aside>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-5 py-2 text-sm text-slate-600 shadow backdrop-blur">
        Base limpia mapa · siguiente paso: icono avión + rotación
      </div>
    </div>
  );
}