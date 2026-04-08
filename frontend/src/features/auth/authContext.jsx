import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const authenticatedUser = await getCurrentUser();
        setUser(authenticatedUser);
      } catch (error) {
        console.error("Error recuperando usuario autenticado:", error);
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const signIn = async ({ email, password }) => {
    const tokenResponse = await loginUser({ email, password });

    if (!tokenResponse?.access_token) {
      throw new Error("No se recibió el token de acceso del servidor.");
    }

    localStorage.setItem("access_token", tokenResponse.access_token);

    try {
      const authenticatedUser = await getCurrentUser();
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      localStorage.removeItem("access_token");
      setUser(null);
      throw error;
    }
  };

  const signUp = async ({ email, password }) => {
    await registerUser({ email, password });
    return signIn({ email, password });
  };

  const signOut = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn("Logout backend devolvió error, se limpia sesión local igualmente:", error);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}