const API_BASE_URL = "";

export async function apiRequest(path, options = {}) {
  const accessToken = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Ha ocurrido un error al comunicar con el servidor.";
    throw new Error(message);
  }

  return data;
}

export async function registerUser({ email, password }) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function loginUser({ email, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  });
}

export async function logoutUser() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}