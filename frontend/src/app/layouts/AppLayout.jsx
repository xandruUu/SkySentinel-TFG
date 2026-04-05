import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";

function Avatar({ email }) {
  const letter = (email?.[0] || "?").toUpperCase();
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white font-bold">
      {letter}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-primary/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            className="flex items-center gap-3"
            onClick={() => navigate("/app/map", { replace: true })}
          >
            <span className="text-lg font-black tracking-tight text-primary">SkySentinel</span>
            <span className="text-xs text-muted">Live Flight Radar</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-card"
              onClick={() => navigate("/app/profile")}
              title="Perfil"
            >
              <Avatar email={user?.email} />
              <span className="hidden text-sm font-semibold sm:block">{user?.email}</span>
            </button>

            <button
              className="rounded-2xl bg-card px-3 py-2 text-sm font-semibold ring-1 ring-primary/10 hover:ring-secondary/20"
              onClick={doLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-6xl px-4 pb-3">
          <div className="flex gap-2">
            <NavLink
              to="/app/map"
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-primary/10 ${
                  isActive ? "bg-primary text-white" : "bg-white hover:bg-card"
                }`
              }
            >
              Mapa
            </NavLink>

            <NavLink
              to="/app/profile"
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-primary/10 ${
                  isActive ? "bg-primary text-white" : "bg-white hover:bg-card"
                }`
              }
            >
              Perfil
            </NavLink>
          </div>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
