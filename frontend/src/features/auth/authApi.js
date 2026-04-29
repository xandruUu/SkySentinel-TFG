const API_BASE_URL = "";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Ha ocurrido un error al comunicar con el servidor.";
    throw new Error(message);
  }

  return data;
}

export async function registerUser({
  email,
  password,
  username,
  firstName,
  lastName,
}) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      username,
      first_name: firstName,
      last_name: lastName,
    }),
  });
}

export async function loginUser({ email, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token) {
  return apiRequest("/api/auth/me", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function logoutUser(token) {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}