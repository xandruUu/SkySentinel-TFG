import { useEffect, useMemo, useState } from "react";

import { useAircraftAlerts } from "../../features/alerts/useAircraftAlerts.js";
import { useLiveFlights } from "../../features/flights/useLiveFlights.js";

import FiltersPanel from "./components/FiltersPanel.jsx";
import MobileFiltersDrawer from "./components/MobileFiltersDrawer.jsx";
import SelectionCard from "./components/SelectionCard.jsx";
import { MADRID_BOUNDS } from "./constants/mapConstants.js";
import { useAircraftMap } from "./hooks/useAircraftMap.js";
import { toFeatureCollection } from "./utils/aircraftGeojson.js";
import {
  buildAlertFeatureCollection,
  buildSelectedFeatureCollection,
} from "./utils/alertMatching.js";
import { isMobileViewport } from "./utils/mapFormatters.js";

function normalizeAlertValue(value) {
  return String(value || "").trim().toUpperCase();
}

function hasDuplicateAlert({ alerts, type, selectedModel, selectedCompany }) {
  const selectedValue = normalizeAlertValue(
    type === "model" ? selectedModel : selectedCompany
  );

  if (!selectedValue) return false;

  return alerts.some((alert) => {
    if (alert.is_active === false) return false;

    const alertValue =
      type === "model"
        ? alert.aircraft_model || alert.model || ""
        : alert.operator_company || alert.operator || "";

    return normalizeAlertValue(alertValue) === selectedValue;
  });
}

export default function MapPage() {
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

  const { mapContainerRef, closePopup } = useAircraftMap({
    geojson,
    alertFeatureCollection,
    selectedFeatureCollection,
    onSelectAircraft: setSelectedId,
    onCardExpandedChange: setCardExpanded,
  });

  useEffect(() => {
    if (selectedAircraft) {
      setCardExpanded(!isMobileViewport());
    }
  }, [selectedAircraft]);

  async function handleCreateAlert(type) {
    if (submittingAlert) return;
    if (type === "model" && !selectedModel) return;
    if (type === "company" && !selectedCompany) return;

    const alreadyExists = hasDuplicateAlert({
      alerts,
      type,
      selectedModel,
      selectedCompany,
    });

    if (alreadyExists) {
      window.alert("Ya existe una alerta activa igual.");
      return;
    }

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

      <MobileFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filterPanelProps={filterPanelProps}
      />

      <SelectionCard
        aircraft={selectedAircraft}
        expanded={cardExpanded}
        setExpanded={setCardExpanded}
        onClose={() => {
          setSelectedId(null);
          closePopup();
        }}
      />
    </div>
  );
}