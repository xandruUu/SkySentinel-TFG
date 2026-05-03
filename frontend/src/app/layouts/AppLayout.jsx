import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, BellOff } from "lucide-react";

import { useAuth } from "../../features/auth/useAuth.js";

function getNotificationStatus() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function getNotificationLabel(status) {
  if (status === "granted") return "Activadas";
  if (status === "denied") return "Bloqueadas";
  if (status === "unsupported") return "No soportadas";
  return "Pendientes";
}

function getDisplayName(user) {
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  return fullName || user?.username || user?.email || "Usuario";
}

function Avatar({ user }) {
  const displayName = getDisplayName(user);
  const letter = (displayName?.[0] || "?").toUpperCase();

  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
      {letter}
    </div>
  );
}

function NavPill({ active, children, ...props }) {
  return (
    <button
      {...props}
      type="button"
      className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ring-1 ${
        active
          ? "bg-primary text-white ring-primary/20"
          : "bg-white text-ink ring-primary/10 hover:bg-card"
      }`}
    >
      {children}
    </button>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">
        {value || "No disponible"}
      </p>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("default");

  const profileButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  const isMapRoute = location.pathname.startsWith("/app/map");

  const fullName = useMemo(() => {
    return `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  }, [user]);

  const closeProfile = () => {
    setProfileOpen(false);
    requestAnimationFrame(() => profileButtonRef.current?.focus());
  };

  const openProfile = () => {
    setProfileOpen(true);
  };

  const goMap = () => navigate("/app/map");

  const doLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
  };

  const testNotification = () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }

    if (Notification.permission !== "granted") {
      setNotificationStatus(Notification.permission);
      return;
    }

    new Notification("SkySentinel", {
      body: "Notificación de prueba activada correctamente.",
      icon: "/icons/icon-192.png",
    });
  };

  useEffect(() => {
    setNotificationStatus(getNotificationStatus());
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeProfile();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [profileOpen]);

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-primary/10 bg-white/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:py-4">
          <div className="flex justify-self-start gap-2">
            <NavPill active={isMapRoute} onClick={goMap}>
              Mapa
            </NavPill>
          </div>

          <button
            type="button"
            className="justify-self-center text-2xl font-black tracking-tight text-primary transition hover:opacity-90 sm:text-3xl"
            onClick={goMap}
            aria-label="Ir al mapa de SkySentinel"
          >
            SkySentinel
          </button>

          <div className="justify-self-end">
            <button
              ref={profileButtonRef}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1 transition ring-1 ${
                profileOpen
                  ? "bg-primary/5 ring-primary/20"
                  : "bg-white ring-primary/10 hover:bg-card"
              }`}
              onClick={openProfile}
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
              aria-controls="profile-drawer"
              title="Abrir cuenta"
            >
              <Avatar user={user} />
            </button>
          </div>
        </div>
      </header>

      {profileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px]"
          onClick={closeProfile}
        >
          <aside
            id="profile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-drawer-title"
            className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-white p-4 shadow-2xl ring-1 ring-slate-200 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Cuenta
                </p>
                <h2
                  id="profile-drawer-title"
                  className="mt-1 text-xl font-black tracking-tight text-primary"
                >
                  Perfil
                </h2>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeProfile}
                className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-card p-4 ring-1 ring-primary/10">
                <div className="flex items-center gap-3">
                  <Avatar user={user} />

                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-primary">
                      {user?.username || "Usuario sin alias"}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-muted">
                      {user?.email || "Correo no disponible"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-primary/10">
                <div className="space-y-4">
                  <InfoBlock label="Nombre de usuario" value={user?.username} />
                  <InfoBlock label="Nombre completo" value={fullName} />
                  <InfoBlock label="Correo electrónico" value={user?.email} />
                  <InfoBlock label="Rol" value={user?.role} />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-primary/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Notificaciones
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {getNotificationLabel(notificationStatus)}
                    </p>
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-primary">
                    {notificationStatus === "granted" ? (
                      <Bell size={20} />
                    ) : (
                      <BellOff size={20} />
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={requestNotifications}
                    disabled={notificationStatus === "unsupported"}
                    className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Permitir notificaciones
                  </button>

                  <button
                    type="button"
                    onClick={testNotification}
                    disabled={notificationStatus !== "granted"}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-primary ring-1 ring-primary/15 transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Probar aviso
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={doLogout}
                className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      <Outlet />
    </div>
  );
}