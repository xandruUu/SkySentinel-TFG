import { useState } from "react";
import { getMe, loginUser, registerUser } from "./authApi.js";

const ACCESS_TOKEN_KEY = "skysentinel_access_token";
const CURRENT_USER_KEY = "skysentinel_current_user";

export function useAuthFlow({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
  });

  const openToast = (title, message) => {
    setToast({
      open: true,
      title,
      message,
    });
  };

  const closeToast = () => {
    setToast({
      open: false,
      title: "",
      message: "",
    });
  };

  const saveSession = ({ accessToken, user }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  };

  const handleLogin = async ({ email, pass }) => {
    try {
      setLoading(true);

      if (!email || !pass) {
        openToast("Error de acceso", "Debes completar correo y contraseña.");
        return;
      }

      const tokenResponse = await loginUser({
        email,
        password: pass,
      });

      const user = await getMe(tokenResponse.access_token);

      saveSession({
        accessToken: tokenResponse.access_token,
        user,
      });

      openToast(
        "Acceso correcto",
        `Has iniciado sesión como ${user.username}.`
      );

      onSuccess?.();
    } catch (error) {
      openToast(
        "Error de acceso",
        error.message || "No se ha podido iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, pass }) => {
    try {
      setLoading(true);

      if (!username || !email || !pass) {
        openToast("Registro incompleto", "Faltan campos por rellenar.");
        return;
      }

      const createdUser = await registerUser({
        username,
        email,
        password: pass,
      });

      openToast(
        "Cuenta creada",
        `La cuenta de ${createdUser.username} se ha creado correctamente.`
      );

      onSuccess?.();
    } catch (error) {
      openToast(
        "Error de registro",
        error.message || "No se ha podido completar el registro."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    toast,
    closeToast,
    handleLogin,
    handleRegister,
  };
}