import { ALERT_COLORS } from "../constants/mapConstants.js";
import { normalizeText } from "./mapFormatters.js";
import { emptyFeatureCollection } from "./aircraftGeojson.js";

export function matchesAlert(aircraft, alert) {
  const alertModel = normalizeText(alert.aircraft_model || alert.model);
  const alertOperator = normalizeText(alert.operator_company || alert.operator);

  const aircraftModel = normalizeText(aircraft.model || aircraft.aircraft_model);
  const aircraftOperator = normalizeText(aircraft.operator_company);
  const aircraftCallsign = normalizeText(aircraft.callsign);
  const aircraftCountry = normalizeText(aircraft.origin_country);

  const modelOk =
    !alertModel ||
    (!!aircraftModel &&
      (aircraftModel.includes(alertModel) || alertModel.includes(aircraftModel)));

  const operatorOk =
    !alertOperator ||
    aircraftOperator.includes(alertOperator) ||
    aircraftCallsign.includes(alertOperator) ||
    aircraftCountry.includes(alertOperator);

  return modelOk && operatorOk;
}

export function buildAlertFeatureCollection(geojson, alerts) {
  if (!alerts.length) {
    return emptyFeatureCollection();
  }

  const alertFeatures = [];

  for (const feature of geojson.features) {
    const aircraft = feature.properties || {};

    const matchedAlertIndex = alerts.findIndex(
      (alert) => alert.is_active !== false && matchesAlert(aircraft, alert)
    );

    if (matchedAlertIndex === -1) {
      continue;
    }

    const matchedAlert = alerts[matchedAlertIndex];

    alertFeatures.push({
      ...feature,
      properties: {
        ...aircraft,
        alert_match: true,
        alert_color: ALERT_COLORS[matchedAlertIndex % ALERT_COLORS.length],
        alert_label:
          matchedAlert.aircraft_model ||
          matchedAlert.model ||
          matchedAlert.operator_company ||
          matchedAlert.operator ||
          "Alerta",
      },
    });
  }

  return {
    type: "FeatureCollection",
    features: alertFeatures,
  };
}

export function buildSelectedFeatureCollection({
  selectedId,
  geojson,
  alertFeatureCollection,
}) {
  if (!selectedId) {
    return emptyFeatureCollection();
  }

  const selectedFeature =
    alertFeatureCollection.features.find(
      (feature) => feature.properties?.icao24 === selectedId
    ) ||
    geojson.features.find((feature) => feature.properties?.icao24 === selectedId);

  return selectedFeature
    ? {
        type: "FeatureCollection",
        features: [selectedFeature],
      }
    : emptyFeatureCollection();
}