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
  AIRCRAFT_MODELS,
  AIRLINES,
  ALERT_LAYER_ID,
  ALERT_SOURCE_ID,
  COUNTRIES,
  MADRID_BOUNDS,
  MADRID_CENTER,
  MAX_ALTITUDE_M,
  MAX_SPEED_KMH,
  MIN_ALTITUDE_M,
  MIN_SPEED_KMH,
  SELECTED_LAYER_ID,
  SELECTED_SOURCE_ID,
} from "./constants/mapConstants.js";
import {
  clampNumber,
  formatAltitude,
  formatCoord,
  formatPositionSource,
  formatSpeed,
  formatTime,
  formatTrack,
  isMobileViewport,
} from "./utils/mapFormatters.js";
import { buildRasterStyle } from "./utils/mapStyle.js";

import {
  buildAlertFeatureCollection,
  buildSelectedFeatureCollection,
} from "./utils/alertMatching.js";

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

function FiltersPanel({
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
  onCreateAlert,
  onDeleteAlert,
}) {
  return (
    <div className="w-full rounded-3xl bg-white/92 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>

      <div className="mt-1 text-sm text-slate-500">
        {data?.aircraft_count ?? 0} detectados · {visibleAircraftCount} visibles · refresh 15s
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Buscar aeronave
          </label>
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder="Callsign, ICAO24 o matrícula"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Este buscador solo filtra por identificadores. País, velocidad y altitud tienen filtros propios.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            País de origen
          </label>
          <select
            value={filters.country}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, country: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
          >
            {COUNTRIES.map((country) => (
              <option key={country.label} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
          <p className="text-sm font-black text-primary">Altitud</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            Rango permitido: {MIN_ALTITUDE_M} m - {MAX_ALTITUDE_M.toLocaleString("es-ES")} m.
            0 m representa tierra y 13.000 m equivale aproximadamente a 41.000 ft.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Mínima
              </label>
              <input
                type="number"
                min={MIN_ALTITUDE_M}
                max={MAX_ALTITUDE_M}
                value={filters.minAltitude}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    minAltitude: clampNumber(
                      event.target.value,
                      MIN_ALTITUDE_M,
                      MAX_ALTITUDE_M
                    ),
                  }))
                }
                placeholder="0 m"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Máxima
              </label>
              <input
                type="number"
                min={MIN_ALTITUDE_M}
                max={MAX_ALTITUDE_M}
                value={filters.maxAltitude}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxAltitude: clampNumber(
                      event.target.value,
                      MIN_ALTITUDE_M,
                      MAX_ALTITUDE_M
                    ),
                  }))
                }
                placeholder="13000 m"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
          <p className="text-sm font-black text-primary">Velocidad</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            Rango permitido: {MIN_SPEED_KMH} km/h - {MAX_SPEED_KMH} km/h.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Mínima
              </label>
              <input
                type="number"
                min={MIN_SPEED_KMH}
                max={MAX_SPEED_KMH}
                value={filters.minSpeed}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    minSpeed: clampNumber(
                      event.target.value,
                      MIN_SPEED_KMH,
                      MAX_SPEED_KMH
                    ),
                  }))
                }
                placeholder="0 km/h"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Máxima
              </label>
              <input
                type="number"
                min={MIN_SPEED_KMH}
                max={MAX_SPEED_KMH}
                value={filters.maxSpeed}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxSpeed: clampNumber(
                      event.target.value,
                      MIN_SPEED_KMH,
                      MAX_SPEED_KMH
                    ),
                  }))
                }
                placeholder="1050 km/h"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
            </div>
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

        <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
          <p className="text-sm font-black text-primary">Crear alerta</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            Las alertas funcionan como filtros permanentes de vigilancia.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Modelo de aeronave
              </label>
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="">Seleccionar modelo</option>
                {AIRCRAFT_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onCreateAlert("model")}
                disabled={!selectedModel || submittingAlert}
                className="mt-2 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Crear alerta por modelo
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">
                Compañía / callsign
              </label>
              <select
                value={selectedCompany}
                onChange={(event) => setSelectedCompany(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="">Seleccionar compañía</option>
                {AIRLINES.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onCreateAlert("company")}
                disabled={!selectedCompany || submittingAlert}
                className="mt-2 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Crear alerta por compañía
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 ring-1 ring-primary/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-primary">Alertas activas</p>
            <span className="rounded-full bg-card px-2 py-1 text-xs font-black text-primary">
              {alerts.length}
            </span>
          </div>

          {alertsError && (
            <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {alertsError}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {alertsLoading && alerts.length === 0 && (
              <p className="text-xs font-semibold text-muted">Cargando alertas...</p>
            )}

            {!alertsLoading && alerts.length === 0 && (
              <p className="text-xs font-semibold text-muted">
                No hay alertas creadas.
              </p>
            )}

            {alerts.map((alert) => (
              <div
                key={alert.id || alert.alert_id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 px-3 py-2"
              >
                <p className="truncate text-xs font-black text-ink">
                  {alert.aircraft_model || alert.model
                    ? `Modelo · ${alert.aircraft_model || alert.model}`
                    : `Compañía · ${alert.operator_company || alert.operator || "—"}`}
                </p>

                <button
                  type="button"
                  onClick={() => onDeleteAlert(alert.id || alert.alert_id)}
                  className="shrink-0 rounded-xl px-2 py-1 text-xs font-black text-red-600 ring-1 ring-red-100 hover:bg-red-50"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setFilters({
              query: "",
              hideGround: false,
              onlyInAir: false,
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
    </div>
  );
}

function SelectionCard({ aircraft, expanded, setExpanded, onClose }) {
  if (!aircraft) return null;

  const compactSummary = `${aircraft.on_ground ? "En tierra" : "En vuelo"} · ${formatSpeed(
    aircraft.velocity
  )} · ${formatAltitude(aircraft.geo_altitude ?? aircraft.baro_altitude)}`;

  return (
    <div className="absolute bottom-4 left-3 right-3 z-20 md:left-auto md:right-4 md:bottom-4 md:w-[380px] md:max-w-[calc(100vw-2rem)]">
      <div
        className={`panel-scroll-area rounded-3xl bg-white/95 p-4 shadow-2xl ring-1 ring-slate-200 backdrop-blur ${
          expanded ? "max-h-[52dvh] overflow-y-auto" : "overflow-hidden"
        } md:max-h-none`}
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
              Modelo · {aircraft.aircraft_model || aircraft.model || "Desconocido"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              Operador · {aircraft.operator_company || "Desconocido"}
            </p>

            {aircraft.alert_label && (
              <p
                className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black text-white"
                style={{ backgroundColor: aircraft.alert_color || "#ef4444" }}
              >
                Alerta · {aircraft.alert_label}
              </p>
            )}
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
            <p className="text-sm font-semibold text-slate-800">
              {compactSummary}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatCoord(aircraft.latitude)}, {formatCoord(aircraft.longitude)}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="font-bold text-slate-700">País</p>
              <p className="break-words text-slate-900">
                {aircraft.origin_country || "—"}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Estado</p>
              <p className="text-slate-900">
                {aircraft.on_ground ? "En tierra" : "En vuelo"}
              </p>
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
              <p className="text-slate-900">
                {formatAltitude(aircraft.geo_altitude)}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Altitud baro</p>
              <p className="text-slate-900">
                {formatAltitude(aircraft.baro_altitude)}
              </p>
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
              <p className="font-bold text-slate-700">Matrícula</p>
              <p className="text-slate-900">{aircraft.registration || "—"}</p>
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
              <p className="text-slate-900">
                {formatPositionSource(aircraft.position_source)}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Último contacto</p>
              <p className="text-slate-900">{formatTime(aircraft.last_contact)}</p>
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