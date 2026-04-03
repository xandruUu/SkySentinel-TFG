import ScreenShell from "../shared/ui/ScreenShell.jsx";
import Card from "../shared/ui/Card.jsx";
import PrimaryButton from "../shared/ui/PrimaryButton.jsx";
import GhostButton from "../shared/ui/GhostButton.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import { Navigate, useNavigate } from "react-router-dom";

export default function ProtectedScreen() {
  const { user, logout, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();

  if (initializing) {
    return (
      <div className="min-h-dvh grid place-items-center text-muted">
        Comprobando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <ScreenShell>
      <Card>
        <h1 className="text-2xl font-black tracking-tight text-primary">
          Sesión iniciada
        </h1>

        <p className="mt-2 text-sm text-muted">
          Has iniciado sesión como{" "}
          <span className="font-semibold text-ink">{user?.email}</span>.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton
            type="button"
            onClick={() => navigate("/", { replace: true })}
          >
            Ir al inicio
          </PrimaryButton>

          <GhostButton type="button" onClick={doLogout}>
            Cerrar sesión
          </GhostButton>
        </div>
      </Card>
    </ScreenShell>
  );
}