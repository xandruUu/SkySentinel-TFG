import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

import avionMarker from "../../../assets/avion1.png";
import {
  AIRCRAFT_IMAGE_ID,
  AIRCRAFT_LAYER_ID,
  AIRCRAFT_SOURCE_ID,
  ALERT_LAYER_ID,
  ALERT_SOURCE_ID,
  MADRID_CENTER,
  SELECTED_LAYER_ID,
  SELECTED_SOURCE_ID,
} from "../constants/mapConstants.js";
import { buildPopupHtml } from "../utils/aircraftPopupHtml.js";
import { emptyFeatureCollection } from "../utils/aircraftGeojson.js";
import { isMobileViewport } from "../utils/mapFormatters.js";
import { buildRasterStyle } from "../utils/mapStyle.js";

export function useAircraftMap({
  geojson,
  alertFeatureCollection,
  selectedFeatureCollection,
  onSelectAircraft,
  onCardExpandedChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);

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

    function closeInternalPopup() {
      popupRef.current?.remove();
      popupRef.current = null;
    }

    function focusAircraft(coordinates) {
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
    }

    function handleAircraftClick(event) {
      const feature = event.features?.[0];

      if (!feature) return;

      const aircraft = feature.properties || {};
      const coordinates = feature.geometry?.coordinates;

      if (!coordinates) return;

      const mobile = isMobileViewport();

      onSelectAircraft(aircraft.icao24 || null);
      onCardExpandedChange(!mobile);
      closeInternalPopup();

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: mobile ? 10 : 18,
        maxWidth: mobile ? "260px" : "300px",
      })
        .setLngLat(coordinates)
        .setHTML(buildPopupHtml(aircraft))
        .addTo(map);

      popupRef.current = popup;
      focusAircraft(coordinates);
    }

    map.on("load", () => {
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

        map.on("click", AIRCRAFT_LAYER_ID, handleAircraftClick);

        map.on("mouseenter", AIRCRAFT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", AIRCRAFT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        setMapLoaded(true);
      };

      image.src = avionMarker;
    });

    map.on("click", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [AIRCRAFT_LAYER_ID],
      });

      if (features.length === 0) {
        onSelectAircraft(null);
        closeInternalPopup();
      }
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [onCardExpandedChange, onSelectAircraft]);

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

  function closePopup() {
    popupRef.current?.remove();
    popupRef.current = null;
  }

  return {
    mapContainerRef,
    closePopup,
  };
}