const API_BASE_URL = "";

function getAccessToken() {
  return localStorage.getItem("access_token");
}

export async function getLiveFlights(bbox, options = {}) {
  const accessToken = getAccessToken();

  const params = new URLSearchParams({
    lamin: String(bbox.lamin),
    lomin: String(bbox.lomin),
    lamax: String(bbox.lamax),
    lomax: String(bbox.lomax),
  });

  const response = await fetch(`${API_BASE_URL}/api/flights/live?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Error HTTP ${response.status} al cargar vuelos.`;
    throw new Error(message);
  }

  return data;
}