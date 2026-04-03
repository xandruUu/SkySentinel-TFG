import { useCallback, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, logoutUser, registerUser } from "./authApi.js";
import {
  clearSession,
  readStoredToken,
  readStoredUser,
  saveSession,
} from "./authStorage.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => readStoredToken());
  const [initializing, setInitializing] = useState(true);

  const refreshSession = useCallback(async () => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setInitializing(false);
      return;
    }

    try {
      const me = await getMe(storedToken);
      setUser(me);
      setToken(storedToken);
      saveSession({ accessToken: storedToken, user: me });
    } catch {
      clearSession();
      setUser(null);
      setToken(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async ({ email, password }) => {
    const tokenResponse = await loginUser({ email, password });
    const me = await getMe(tokenResponse.access_token);

    saveSession({
      accessToken: tokenResponse.access_token,
      user: me,
    });

    setUser(me);
    setToken(tokenResponse.access_token);

    return me;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    return registerUser({ email, password });
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token;

    clearSession();
    setUser(null);
    setToken(null);

    try {
      if (currentToken) {
        await logoutUser(currentToken);
      }
    } catch {
      // aunque falle el backend, la sesión del cliente ya está cerrada
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, token, initializing, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}