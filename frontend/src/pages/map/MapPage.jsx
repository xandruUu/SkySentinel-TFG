import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";

import { useAuth } from "../../features/auth/useAuth.js";
import { useFavorites } from "../../features/favorites/useFavorites.js";
import { useLiveFlights } from "../../features/flights/useLiveFlights.js";
import { toAircraftFeatureCollection } from "../../features/flights/flightsGeojson.js";
import FloatingFiltersPanel from "../../widgets/map/FloatingFiltersPanel.jsx";
import FlightPopup from "../../widgets/map/FlightPopup.jsx";

function createRasterStyle() {
  // Ejemplo basado en MapLibre “Add a raster tile source” (OSM). citeturn3search0
  return {
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "raster-tiles",
      },
    ],
    id: "skysentinel-raster",
  };
}

function makePlaneIconCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
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

  const { token } = useAuth();
  const { favorites } = useFavorites();
  const favoritesSet = useMemo(
    () => new Set(favorites.map((f) => (f.icao24 || "").toLowerCase())),
    [favorites]
  );

  const [bounds, setBounds] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    favoritesOnly: false,
    hideGround: true,
  });

  const { data: flightsData, error } = useLiveFlights({
    token,
    bounds: bounds || { lamin: 40.0, lomin: -4.5, lamax: 41.5, lomax: -2.5 },
    refreshMs: 10000,
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
      style: createRasterStyle(),
      center: [-3.7, 40.4], // Madrid por defecto
      zoom: 7,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      const iconCanvas = makePlaneIconCanvas();
      // sdf=true permite recolorear con icon-color
      map.addImage("aircraft-icon", iconCanvas, { sdf: true });

      map.addSource("aircraft", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "icao24",
      });

      map.addLayer({
        id: "aircraft-layer",
        type: "symbol",
        source: "aircraft",
        layout: {
          "icon-image": "aircraft-icon",
          "icon-size": 0.55,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          // icon-rotate rota en grados en sentido horario. citeturn4view0
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

      // calcula bounds inicial
      const b = map.getBounds();
      setBounds({
        lamin: b.getSouth(),
        lomin: b.getWest(),
        lamax: b.getNorth(),
        lomax: b.getEast(),
      });

      map.on("moveend", () => {
        const bb = map.getBounds();
        setBounds({
          lamin: bb.getSouth(),
          lomin: bb.getWest(),
          lamax: bb.getNorth(),
          lomax: bb.getEast(),
        });
      });

      // popup con React
      let activePopup = null;

      map.on("click", "aircraft-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = feature.geometry?.coordinates;
        const props = feature.properties || {};

        if (!coords) return;

        if (activePopup) {
          activePopup.remove();
          activePopup = null;
        }

        const node = document.createElement("div");
        const root = createRoot(node);

        const aircraft = {
          icao24: props.icao24,
          callsign: props.callsign,
          origin_country: props.origin_country,
          velocity: props.velocity,
          baro_altitude: props.baro_altitude,
          geo_altitude: props.geo_altitude,
          true_track: props.true_track,
          on_ground: props.on_ground,
        };

        root.render(
          <FlightPopup
            aircraft={aircraft}
            onClose={() => {
              if (activePopup) activePopup.remove();
            }}
          />
        );

        activePopup = new maplibregl.Popup({ closeOnClick: true })
          .setLngLat(coords)
          .setDOMContent(node)
          .addTo(map);

        activePopup.on("close", () => root.unmount());
      });

      map.on("mouseenter", "aircraft-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "aircraft-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
  }, []);

  // setData cuando cambia geojson
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("aircraft");
    if (!source) return;

    // setData actualiza y re-renderiza. citeturn6view0
    source.setData(geojson);
  }, [geojson]);

  const statusText = error
    ? `Error: ${error}`
    : flightsData
      ? `${flightsData.aircraft_count} aviones • créditos ${flightsData.credits_remaining ?? "—"}`
      : "Cargando vuelos…";

  return (
    <div className="relative h-[calc(100dvh-112px)]">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <FloatingFiltersPanel
        filters={filters}
        setFilters={setFilters}
        statusText={statusText}
      />

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
        <div className="pointer-events-auto rounded-2xl bg-white/75 px-4 py-2 text-xs text-muted ring-1 ring-primary/10 backdrop-blur">
          Tip: mueve el mapa para cambiar el área consultada (bounding box).
        </div>
      </div>
    </div>
  );
}
