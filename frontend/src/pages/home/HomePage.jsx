import { useEffect, useMemo, useState } from "react";
import { Bell, Plane, Radar, Smartphone, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ALERTS_STORAGE_KEY = "skysentinel.aircraftAlerts.v1";

function getNotificationStatus() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function loadAlerts() {
  try {
    return JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAlerts(alerts) {
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

function StatusBadge({ status }) {
  const label =
    status === "granted"
      ? "Permitidas"
      : status === "denied"
        ? "Bloqueadas"
        : status === "unsupported"
          ? "No soportadas"
          : "Pendientes";

  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/10">
      {label}
    </span>
  );
}

function HomeCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-primary/10">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [notificationStatus, setNotificationStatus] = useState("default");
  const [model, setModel] = useState("");
  const [operator, setOperator] = useState("");
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    setNotificationStatus(getNotificationStatus());
    setAlerts(loadAlerts());
  }, []);

  const canCreateAlert = useMemo(() => {
    return model.trim().length > 0 || operator.trim().length > 0;
  }, [model, operator]);

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

  const createAlert = () => {
    if (!canCreateAlert) return;

    const nextAlert = {
      id: crypto.randomUUID(),
      model: model.trim().toUpperCase(),
      operator: operator.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    const nextAlerts = [nextAlert, ...alerts];
    setAlerts(nextAlerts);
    saveAlerts(nextAlerts);
    setModel("");
    setOperator("");
  };

  const deleteAlert = (id) => {
    const nextAlerts = alerts.filter((alert) => alert.id !== id);
    setAlerts(nextAlerts);
    saveAlerts(nextAlerts);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <section className="overflow-hidden rounded-[32px] bg-primary p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
              Centro de control
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              SkySentinel
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Accede al radar en vivo, crea alertas por aeronave o compañía y prepara las
              notificaciones para móvil.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/app/map")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-primary shadow-sm transition hover:opacity-95"
          >
            <Radar size={18} />
            Abrir radar
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">

        <HomeCard
          icon={Bell}
          title="Alertas inteligentes"
          description="Crea alertas locales por modelo de avión o compañía/callsign."
        >
          <div className="grid gap-3">
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="Modelo: A320, B738, A400M..."
              className="w-full rounded-2xl border border-primary/10 bg-card px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary"
            />

            <input
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              placeholder="Compañía/callsign: IBE, RYR, UAE..."
              className="w-full rounded-2xl border border-primary/10 bg-card px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary"
            />

            <button
              type="button"
              disabled={!canCreateAlert}
              onClick={createAlert}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Guardar alerta
            </button>
          </div>
        </HomeCard>

        <HomeCard
          icon={Smartphone}
          title="Notificaciones móvil"
          description="Prepara los permisos para recibir avisos cuando una aeronave coincida."
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-primary/10">
              <span className="text-sm font-bold text-ink">Estado del permiso</span>
              <StatusBadge status={notificationStatus} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={requestNotifications}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-95"
              >
                Permitir notificaciones
              </button>

              <button
                type="button"
                onClick={testNotification}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-primary ring-1 ring-primary/15 transition hover:bg-card"
              >
                Probar aviso
              </button>
            </div>
          </div>
        </HomeCard>

        <HomeCard
          icon={Plane}
          title="Alertas guardadas"
          description="Primera versión local. Después las conectaremos al backend."
        >
          {alerts.length === 0 ? (
            <div className="rounded-2xl bg-card p-4 text-sm font-semibold text-muted ring-1 ring-primary/10">
              Todavía no tienes alertas guardadas.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-primary/10"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">
                      {alert.model || "Cualquier modelo"} ·{" "}
                      {alert.operator || "Cualquier compañía"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      Alerta local
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteAlert(alert.id)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-primary ring-1 ring-primary/10 transition hover:bg-red-50"
                    aria-label="Eliminar alerta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </HomeCard>
      </div>
    </main>
  );
}