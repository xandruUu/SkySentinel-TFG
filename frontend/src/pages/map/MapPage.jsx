import { useEffect, useMemo, useRef, useState } from "react";

import maplibregl from "maplibre-gl";

import { useLiveFlights } from "../../features/flights/useLiveFlights.js";

import { useAircraftAlerts } from "../../features/alerts/useAircraftAlerts.js";

import avionMarker from "../../assets/avion1.png";

import {
  emptyFeatureCollection,
  toFeatureCollection,
} from "./utils/aircraftGeojson.js";

import {
  AIRCRAFT_IMAGE_ID,
  AIRCRAFT_LAYER_ID,
  AIRCRAFT_SOURCE_ID,
  ALERT_LAYER_ID,
  ALERT_SOURCE_ID,
  MADRID_BOUNDS,
  MADRID_CENTER,
  SELECTED_LAYER_ID,
  SELECTED_SOURCE_ID,
} from "./constants/mapConstants.js";

import {
  isMobileViewport,
} from "./utils/mapFormatters.js";

import { buildRasterStyle } from "./utils/mapStyle.js";

import {
  buildAlertFeatureCollection,
  buildSelectedFeatureCollection,
} from "./utils/alertMatching.js";

import SelectionCard from "./components/SelectionCard.jsx";
import FiltersPanel from "./components/FiltersPanel.jsx";

function buildPopupHtml(aircraft) {
  const model = aircraft.aircraft_model || aircraft.model || "Modelo desconocido";
  const operator = aircraft.operator_company || "Operador desconocido";

  const alertLabel = aircraft.alert_label
    ? `<div style="margin-top:8px;display:inline-block;border-radius:999px;background:${aircraft.alert_color};color:white;padding:4px 8px;font-size:11px;font-weight:800;">Alerta: ${aircraft.alert_label}</div>`
    : "";

  return `
    <div style="min-width:190px;font-family:Inter,Arial,sans-serif;text-align:center;padding:4px 2px;">
      <div style="font-size:22px;font-weight:900;color:#2563eb;letter-spacing:1px;line-height:1.1;">
        ${aircraft.callsign?.trim() || aircraft.icao24 || "—"}
      </div>

      <div style="margin-top:4px;font-size:13px;color:#64748b;font-weight:600;">
        ${model}
      </div>

      <div style="margin-top:2px;font-size:12px;color:#64748b;font-weight:600;">
        ${operator}
      </div>

      ${alertLabel}
    </div>
  `;
}

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(!isMobileViewport());

  const {
    alerts,
    createAlert,
    deleteAlert,
    loading: alertsLoading,
    error: alertsError,
  } = useAircraftAlerts();

  const [selectedModel, setSelectedModel] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [submittingAlert, setSubmittingAlert] = useState(false);

  const [filters, setFilters] = useState({
    query: "",
    hideGround: false,
    onlyInAir: false,
    country: "",
    minAltitude: "",
    maxAltitude: "",
    minSpeed: "",
    maxSpeed: "",
  });

  async function handleCreateAlert(type) {
    if (submittingAlert) return;
    if (type === "model" && !selectedModel) return;
    if (type === "company" && !selectedCompany) return;

    setSubmittingAlert(true);

    try {
      await createAlert({
        model: type === "model" ? selectedModel : "",
        operator: type === "company" ? selectedCompany : "",
      });

      setSelectedModel("");
      setSelectedCompany("");
    } finally {
      setSubmittingAlert(false);
    }
  }

  const { data } = useLiveFlights({
    bounds: MADRID_BOUNDS,
    refreshMs: 15000,
    enabled: true,
  });

  const rawStates = data?.states || [];

  const geojson = useMemo(() => {
    return toFeatureCollection(rawStates, filters);
  }, [rawStates, filters]);

const alertFeatureCollection = useMemo(() => {
  return buildAlertFeatureCollection(geojson, alerts);
}, [geojson, alerts]);

const selectedFeatureCollection = useMemo(() => {
  return buildSelectedFeatureCollection({
    selectedId,
    geojson,
    alertFeatureCollection,
  });
}, [selectedId, geojson, alertFeatureCollection]);

  const selectedAircraft =
    selectedFeatureCollection.features[0]?.properties || null;

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

      map.addSource(AIRCRAFT_SOURCE_ID, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });

      map.addSource(ALERT_SOURCE_ID, {
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

        map.addLayer({
          id: ALERT_LAYER_ID,
          type: "circle",
          source: ALERT_SOURCE_ID,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              17,
              8,
              23,
              10,
              29,
              12,
              35,
            ],
            "circle-color": ["get", "alert_color"],
            "circle-opacity": 0.16,
            "circle-stroke-color": ["get", "alert_color"],
            "circle-stroke-width": 2,
          },
        });

        map.addLayer({
          id: SELECTED_LAYER_ID,
          type: "circle",
          source: SELECTED_SOURCE_ID,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              15,
              8,
              20,
              10,
              24,
              12,
              30,
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
              6,
              0.06,
              8,
              0.075,
              10,
              0.09,
              12,
              0.1125,
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

    map.getSource(AIRCRAFT_SOURCE_ID)?.setData(geojson);
    map.getSource(ALERT_SOURCE_ID)?.setData(alertFeatureCollection);
    map.getSource(SELECTED_SOURCE_ID)?.setData(selectedFeatureCollection);
  }, [geojson, alertFeatureCollection, selectedFeatureCollection, mapLoaded]);

  useEffect(() => {
    if (selectedFeatureCollection.features.length > 0) return;

    popupRef.current?.remove();
    popupRef.current = null;
  }, [selectedFeatureCollection]);

  const visibleAircraftCount = geojson.features.length;

  const filterPanelProps = {
    filters,
    setFilters,
    data,
    visibleAircraftCount,
    alerts,
    alertsLoading,
    alertsError,
    selectedModel,
    setSelectedModel,
    selectedCompany,
    setSelectedCompany,
    submittingAlert,
    onCreateAlert: handleCreateAlert,
    onDeleteAlert: deleteAlert,
  };

  return (
    <div className="relative h-[calc(100dvh-73px)] overflow-hidden bg-slate-100">
      <div ref={mapContainerRef} className="map-touch-area h-full w-full" />

      <div className="panel-scroll-area absolute left-4 top-4 z-10 hidden max-h-[calc(100dvh-120px)] w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto md:block">
        <FiltersPanel {...filterPanelProps} />
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        className="absolute left-4 top-4 z-30 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-xl ring-1 ring-primary/20 md:hidden"
      >
        Filtros
      </button>

      {filtersOpen && (
        <div
          className="absolute inset-0 z-40 overflow-hidden bg-black/35 backdrop-blur-[2px] md:hidden"
          onTouchMove={(event) => event.preventDefault()}
        >
          <div
            className="panel-scroll-area absolute left-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto bg-white p-4 shadow-2xl"
            onTouchMove={(event) => event.stopPropagation()}
          >
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

            <FiltersPanel {...filterPanelProps} />
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