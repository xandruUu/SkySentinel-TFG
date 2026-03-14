import { useState } from "react";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const handleLogin = async ({ email, pass }) => {
    try {
      setLoading(true);

      // Placeholder hasta conectar con backend real
      await wait(700);

      if (!email || !pass) {
        openToast("Error de acceso", "Debes completar correo y contraseña.");
        return;
      }

      openToast(
        "Acceso correcto",
        `Has iniciado sesión como ${email}.`
      );

      onSuccess?.();
    } catch {
      openToast(
        "Error",
        "Ha ocurrido un problema durante el inicio de sesión."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ name, email, pass }) => {
    try {
      setLoading(true);

      // Placeholder hasta conectar con backend real
      await wait(800);

      if (!name || !email || !pass) {
        openToast("Registro incompleto", "Faltan campos por rellenar.");
        return;
      }

      openToast(
        "Cuenta creada",
        `La cuenta de ${name} se ha creado correctamente.`
      );

      onSuccess?.();
    } catch {
      openToast(
        "Error",
        "Ha ocurrido un problema durante el registro."
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