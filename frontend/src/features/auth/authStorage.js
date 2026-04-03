const ACCESS_TOKEN_KEY = "skysentinel_access_token";
const CURRENT_USER_KEY = "skysentinel_current_user";

export function readStoredToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
}

export function readStoredUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession({ accessToken, user }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}
