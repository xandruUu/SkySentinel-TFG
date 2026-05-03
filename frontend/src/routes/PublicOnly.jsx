import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth.js";

export default function PublicOnly({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted">
        Cargando...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/map" replace />;
  }

  return children;
}