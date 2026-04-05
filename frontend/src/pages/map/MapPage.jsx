import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";

import { useAuth } from "../../features/auth/useAuth.js";
import { useFavorites } from "../../features/favorites/useFavorites.js";
import { useLiveFlights } from "../../features/flights/useLiveFlights.js";
import { toAircraftFeatureCollection } from "../../features/flights/flightsGeojson.js";
import FloatingFiltersPanel from "../../widgets/map/FloatingFiltersPanel.jsx";
import FlightPopup from "../../widgets/map/FlightPopup.jsx";

// Basemap recomendado para DEV (puedes cambiarlo después)
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

const MADRID_CENTER = [-3.7038, 40.4168];
const DEFAULT_BOUNDS = { lamin: 40.0, lomin: -4.5, lamax: 41.5, lomax: -2.5 };

// Debe alinearse en lo posible con la cuantización del backend
function quantize(value, step = 0.1) {
  return Math.round(value / step) * step;
}

function makePlaneIconCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, 64, 64);

  // flecha simple
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(44, 44);
  ctx.lineTo(32, 38);
  ctx.lineTo(20, 44);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // ⚠️ Importante: bounds en ref para NO reiniciar el polling
  const boundsRef = useRef(DEFAULT_BOUNDS);

  const popupRef = useRef(null);
  const popupRootRef = useRef(null);

  const { token } = useAuth();
  const { favorites } = useFavorites();

  const favoritesSet = useMemo(() => {
    return new Set(favorites.map((f) => (f.icao24 || "").toLowerCase()));
  }, [favorites]);

  const [filters, setFilters] = useState({
    query: "",
    favoritesOnly: false,
    hideGround: true,
  });

  // Polling más conservador; luego lo hacemos adaptativo en el hook
  const { data: flightsData, error, meta } = useLiveFlights({
    token,
    boundsRef,
    enabled: true,
    baseRefreshMs: 25000,
  });

  const geojson = useMemo(() => {
    if (!flightsData) return { type: "FeatureCollection", features: [] };
    return toAircraftFeatureCollection({
      flightsResponse: flightsData,
      favoritesSet,
      filters,
    });
  }, [flightsData, favoritesSet, filters]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: MADRID_CENTER,
      zoom: 7,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const handleResize = () => map.resize();
    window.addEventListener("resize", handleResize);

    map.on("load", () => {
      // Asegura tamaño correcto del canvas tras layout
      map.resize();

      const iconCanvas = makePlaneIconCanvas();
      if (!map.hasImage("aircraft-icon")) {
        // sdf permite recolorear con icon-color
        map.addImage("aircraft-icon", iconCanvas, { sdf: true });
      }

      if (!map.getSource("aircraft")) {
        map.addSource("aircraft", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          promoteId: "icao24",
        });
      }

      if (!map.getLayer("aircraft-layer")) {
        map.addLayer({
          id: "aircraft-layer",
          type: "symbol",
          source: "aircraft",
          layout: {
            "icon-image": "aircraft-icon",
            "icon-size": 0.55,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-rotate": ["coalesce", ["get", "true_track"], 0],
            "icon-rotation-alignment": "map",
          },
          paint: {
            "icon-color": [
              "case",
              ["boolean", ["get", "is_favorite"], false],
              "#ff7a00",
              "#2563eb",
            ],
            "icon-halo-color": "#ffffff",
            "icon-halo-width": 1,
          },
        });
      }

      // Bounds inicial cuantizado
      const b = map.getBounds();
      boundsRef.current = {
        lamin: quantize(b.getSouth()),
        lomin: quantize(b.getWest()),
        lamax: quantize(b.getNorth()),
        lomax: quantize(b.getEast()),
      };

      let moveTimer = null;
      map.on("moveend", () => {
        if (moveTimer) clearTimeout(moveTimer);

        // Debounce corto: evita ráfagas
        moveTimer = setTimeout(() => {
          const bb = map.getBounds();
          boundsRef.current = {
            lamin: quantize(bb.getSouth()),
            lomin: quantize(bb.getWest()),
            lamax: quantize(bb.getNorth()),
            lomax: quantize(bb.getEast()),
          };
        }, 200);
      });

      map.on("click", "aircraft-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = feature.geometry?.coordinates;
        const props = feature.properties || {};
        if (!coords) return;

        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
        if (popupRootRef.current) {
          popupRootRef.current.unmount();
          popupRootRef.current = null;
        }

        const node = document.createElement("div");
        const root = createRoot(node);
        popupRootRef.current = root;

        root.render(
          <FlightPopup
            aircraft={{
              icao24: props.icao24,
              callsign: props.callsign,
              origin_country: props.origin_country,
              velocity: props.velocity,
              baro_altitude: props.baro_altitude,
              geo_altitude: props.geo_altitude,
              true_track: props.true_track,
              on_ground: props.on_ground,
            }}
            onClose={() => {
              popupRef.current?.remove();
              popupRef.current = null;
            }}
          />
        );

        const popup = new maplibregl.Popup({ closeOnClick: true })
          .setLngLat(coords)
          .setDOMContent(node)
          .addTo(map);

        popup.on("close", () => {
          popupRootRef.current?.unmount();
          popupRootRef.current = null;
          popupRef.current = null;
        });

        popupRef.current = popup;
      });

      map.on("mouseenter", "aircraft-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "aircraft-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);

      popupRef.current?.remove();
      popupRef.current = null;

      popupRootRef.current?.unmount();
      popupRootRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Volcar GeoJSON al source
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("aircraft");
    if (!source) return;

    source.setData(geojson);
  }, [geojson]);

  const creditsText =
    flightsData?.credits_remaining === null || flightsData?.credits_remaining === undefined
      ? "—"
      : flightsData.credits_remaining;

  const statusText = error
    ? `Error: ${error}`
    : flightsData
      ? `${flightsData.aircraft_count} aviones • créditos ${creditsText} • refresh ${meta.refreshMs / 1000}s`
      : "Cargando vuelos…";

  return (
    <div className="relative h-[calc(100dvh-112px)] min-h-[520px] overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <FloatingFiltersPanel filters={filters} setFilters={setFilters} statusText={statusText} />
    </div>
  );
}
