import { useEffect, useId, useMemo, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function AppMark({ size = 96 }) {
  const gradientId = useId();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--color-secondary)_30%,transparent),transparent_70%)] blur-2xl"
      />
      <div className="relative grid h-full w-full place-items-center rounded-[28px] bg-card ring-1 ring-primary/15 shadow-[0_20px_50px_rgba(30,58,138,0.18)]">
        <svg
          width={Math.round(size * 0.56)}
          height={Math.round(size * 0.56)}
          viewBox="0 0 64 64"
          fill="none"
          className="drop-shadow-[0_10px_25px_rgba(37,99,235,0.22)]"
          role="img"
          aria-label="SkySentinel mark"
        >
          <defs>
            <linearGradient id={gradientId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--color-secondary)" />
              <stop offset="1" stopColor="var(--color-radar)" />
            </linearGradient>
          </defs>

          <circle cx="32" cy="32" r="22" stroke={`url(#${gradientId})`} strokeWidth="2.3" opacity="0.95" />
          <circle cx="32" cy="32" r="14" stroke={`url(#${gradientId})`} strokeWidth="2.3" opacity="0.7" />
          <circle cx="32" cy="32" r="6" stroke={`url(#${gradientId})`} strokeWidth="2.3" opacity="0.5" />

          <path d="M32 32 L52 24" stroke={`url(#${gradientId})`} strokeWidth="2.6" strokeLinecap="round" opacity="0.95" />
          <circle cx="52" cy="24" r="3" fill="var(--color-solar)" />

          <path
            d="M20 48c4-6 10-10 18-10 4.5 0 8.5 1 12 3"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path d="M28 50h8" stroke={`url(#${gradientId})`} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
        </svg>
      </div>
    </div>
  );
}

function ActionToast({ open, title, message, onAccept, acceptButtonRef }) {
  const id = useId();

  return (
    <div
      className={[
        "fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+16px)] z-50 transition-all duration-300",
        open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-4",
      ].join(" ")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        className="mx-auto max-w-xl rounded-3xl bg-ink/95 text-card shadow-[0_30px_90px_rgba(31,41,55,0.35)] ring-1 ring-solar/35 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 text-left">
            <p id={`${id}-title`} className="text-sm font-semibold text-card">
              {title}
            </p>
            <p id={`${id}-message`} className="mt-1 text-sm text-card/70">
              {message}
            </p>
          </div>

          <button
            ref={acceptButtonRef}
            type="button"
            onClick={onAccept}
            className="shrink-0 rounded-full bg-solar px-4 py-2 text-sm font-semibold text-ink shadow-[0_12px_30px_rgba(255,200,61,0.35)] ring-2 ring-solar/70 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

function SlideToAct({ label, direction = "ltr", accent = "secondary", onComplete, disabled = false }) {
  const HANDLE_PX = 72;
  const trackRef = useRef(null);

  const [trackWidth, setTrackWidth] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);

  const maxX = useMemo(() => Math.max(0, trackWidth - HANDLE_PX), [trackWidth]);

  const handleLeft = useMemo(() => {
    if (direction === "ltr") return progress * maxX;
    return maxX - progress * maxX;
  }, [direction, progress, maxX]);

  const fillWidth = useMemo(() => progress * maxX + HANDLE_PX, [progress, maxX]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => setTrackWidth(el.getBoundingClientRect().width);
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const doneThreshold = 0.92;

  const finish = () => {
    if (disabled || completed) return;
    setCompleted(true);
    setProgress(1);
    onComplete?.();
  };

  const getProgressFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return 0;

    const rect = el.getBoundingClientRect();
    const raw = clientX - rect.left - HANDLE_PX / 2;
    const pos = clamp(raw, 0, maxX);

    if (maxX === 0) return 0;
    if (direction === "ltr") return pos / maxX;
    return (maxX - pos) / maxX;
  };

  const onPointerDown = (e) => {
    if (disabled || completed) return;
    e.preventDefault();
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging || disabled || completed) return;
    setProgress(getProgressFromClientX(e.clientX));
  };

  const onPointerUp = (e) => {
    if (!dragging) return;

    setDragging(false);

    if (progress >= doneThreshold) finish();
    else setProgress(0);

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onKeyDown = (e) => {
    if (disabled || completed) return;

    const step = 0.06;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      finish();
      return;
    }

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();

      const sign = e.key === "ArrowRight" ? 1 : -1;
      const logicalSign = direction === "ltr" ? sign : -sign;

      const next = clamp(progress + logicalSign * step, 0, 1);
      setProgress(next);

      if (next >= doneThreshold) finish();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setProgress(0);
    }
  };

  const icon = direction === "ltr" ? "→" : "←";

  const thumbClasses =
    accent === "radar"
      ? "bg-gradient-to-br from-solar to-radar shadow-[0_16px_45px_rgba(255,122,0,0.35)]"
      : "bg-gradient-to-br from-secondary to-primary shadow-[0_16px_45px_rgba(37,99,235,0.33)]";

  const fillClasses =
    direction === "ltr"
      ? "left-0 bg-gradient-to-r from-secondary/20 via-secondary/10 to-radar/15"
      : "right-0 bg-gradient-to-l from-radar/20 via-radar/10 to-secondary/15";

  const textOpacity = clamp(1 - progress * 1.35, 0, 1);

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className={[
          "relative h-[72px] w-full select-none rounded-full",
          "bg-card/95 ring-1 ring-primary/12 shadow-[0_20px_55px_rgba(30,58,138,0.12)]",
          "overflow-hidden",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className={["absolute inset-y-0 rounded-full transition-[width] duration-200", fillClasses].join(" ")}
          style={{ width: `${fillWidth}px` }}
        />

        <div className="absolute inset-0 grid place-items-center px-14">
          <span
            className="text-[15px] font-semibold tracking-wide text-muted transition-opacity duration-150"
            style={{ opacity: textOpacity }}
          >
            {label}
          </span>
        </div>

        <button
          type="button"
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          disabled={disabled}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={[
            "absolute top-1/2",
            "grid h-[72px] w-[72px] place-items-center rounded-full text-white",
            thumbClasses,
            "ring-2 ring-white/40",
            "touch-none",
            "transition-[transform,filter] duration-300",
            dragging ? "cursor-grabbing" : "cursor-grab",
            completed ? "opacity-90" : "opacity-100",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/40",
            disabled ? "cursor-not-allowed opacity-60" : "",
            "motion-reduce:transition-none",
          ].join(" ")}
          style={{ transform: `translate(${handleLeft}px, -50%)` }}
        >
          <span aria-hidden="true" className="text-2xl leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            {icon}
          </span>
        </button>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
      </div>
    </div>
  );
}

/* ---------- UI building blocks (no libs) ---------- */

function ScreenShell({ children }) {
  return (
    <div
      className="relative min-h-[100dvh] bg-surface text-ink"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,color-mix(in_oklab,var(--color-secondary)_20%,transparent),transparent_55%),radial-gradient(circle_at_50%_78%,color-mix(in_oklab,var(--color-radar)_14%,transparent),transparent_62%)]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="w-full rounded-[32px] bg-card/95 ring-1 ring-primary/10 shadow-[0_25px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm">
      {children}
    </div>
  );
}

function TextInput({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  const id = useId();
  return (
    <div className="text-left">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl bg-white/80 px-4 py-3 text-[15px] text-ink ring-1 ring-primary/10 shadow-[0_12px_30px_rgba(30,58,138,0.08)] outline-none transition focus:ring-4 focus:ring-secondary/20"
        />
      </div>
    </div>
  );
}

function PrimaryButton({ children, variant = "radar", onClick, type = "button", disabled }) {
  const styles =
    variant === "secondary"
      ? "bg-secondary text-white shadow-[0_14px_40px_rgba(37,99,235,0.28)]"
      : "bg-radar text-white shadow-[0_14px_40px_rgba(255,122,0,0.28)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-2xl px-5 py-3.5 text-[15px] font-semibold",
        styles,
        "ring-2 ring-white/30 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full rounded-2xl bg-white/40 px-5 py-3.5 text-[15px] font-semibold text-ink ring-1 ring-primary/10 shadow-[0_12px_30px_rgba(30,58,138,0.06)] transition hover:bg-white/55 focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20"
    >
      {children}
    </button>
  );
}

function HeaderBar({ title, onBack }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl bg-white/45 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-primary/10 shadow-[0_12px_30px_rgba(30,58,138,0.06)] transition hover:bg-white/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20"
        >
          ← Volver
        </button>

        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-xs text-muted">SkySentinel</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Screens ---------- */

function LandingScreen({ onGoLogin, onGoRegister, sliderResetKey, disabled }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <AppMark />

      <h1 className="mt-7 text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-secondary to-radar drop-shadow-[0_20px_55px_rgba(30,58,138,0.12)]">
        Skysentinel
      </h1>
      <p className="mt-3 text-base text-muted">Your Personal Flight Radar</p>

      <div className="mt-14 w-full max-w-[420px] space-y-5">
        <SlideToAct
          key={`login-${sliderResetKey}`}
          label="Desliza para Iniciar Sesión"
          direction="ltr"
          accent="secondary"
          onComplete={onGoLogin}
          disabled={disabled}
        />
        <SlideToAct
          key={`register-${sliderResetKey}`}
          label="Desliza para Registrarse"
          direction="rtl"
          accent="radar"
          onComplete={onGoRegister}
          disabled={disabled}
        />
      </div>

      <p className="mt-10 text-xs text-muted">PWA · iOS/Android/Desktop</p>
    </div>
  );
}

function LoginScreen({ onBack, onSubmit, onGoRegister, loading }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const canSubmit = email.trim().length > 3 && pass.trim().length >= 4;

  return (
    <>
      <HeaderBar title="Iniciar sesión" onBack={onBack} />

      <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="flex justify-center">
            <AppMark size={80} />
          </div>

          <h2 className="mt-8 text-center text-3xl font-black tracking-tight text-ink">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Accede a tu perfil de spotter y tus seguimientos.
          </p>

          <div className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <div className="space-y-5">
                  <TextInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                  <TextInput
                    label="Contraseña"
                    type="password"
                    value={pass}
                    onChange={setPass}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />

                  <PrimaryButton
                    variant="secondary"
                    disabled={!canSubmit || loading}
                    onClick={() => onSubmit({ email, pass })}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </PrimaryButton>

                  <div className="text-center text-sm text-muted">
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={onGoRegister}
                      className="font-semibold text-secondary underline underline-offset-4 decoration-secondary/40"
                    >
                      Crear cuenta
                    </button>
                  </div>

                  <GhostButton onClick={onBack}>Volver al inicio</GhostButton>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function RegisterScreen({ onBack, onSubmit, onGoLogin, loading }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const passOk = pass.trim().length >= 6;
  const match = pass === pass2 && pass2.length > 0;
  const canSubmit = name.trim().length >= 2 && email.trim().length > 3 && passOk && match;

  return (
    <>
      <HeaderBar title="Registro" onBack={onBack} />

      <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="flex justify-center">
            <AppMark size={80} />
          </div>

          <h2 className="mt-8 text-center text-3xl font-black tracking-tight text-ink">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Guarda avistamientos, alertas y aeronaves favoritas.
          </p>

          <div className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <div className="space-y-5">
                  <TextInput
                    label="Nombre"
                    value={name}
                    onChange={setName}
                    placeholder="Xandru"
                    autoComplete="name"
                  />
                  <TextInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />

                  <TextInput
                    label="Contraseña"
                    type="password"
                    value={pass}
                    onChange={setPass}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  <TextInput
                    label="Repetir contraseña"
                    type="password"
                    value={pass2}
                    onChange={setPass2}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                  />

                  <div className="rounded-2xl bg-white/55 p-4 ring-1 ring-primary/10">
                    <p className="text-sm font-semibold text-ink">Requisitos</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      <li className={passOk ? "text-ink" : ""}>• Contraseña ≥ 6 caracteres</li>
                      <li className={match ? "text-ink" : ""}>• Las contraseñas coinciden</li>
                    </ul>
                  </div>

                  <PrimaryButton
                    variant="radar"
                    disabled={!canSubmit || loading}
                    onClick={() => onSubmit({ name, email, pass })}
                  >
                    {loading ? "Creando..." : "Crear cuenta"}
                  </PrimaryButton>

                  <div className="text-center text-sm text-muted">
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={onGoLogin}
                      className="font-semibold text-secondary underline underline-offset-4 decoration-secondary/40"
                    >
                      Iniciar sesión
                    </button>
                  </div>

                  <GhostButton onClick={onBack}>Volver al inicio</GhostButton>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- App (router simple por estado) ---------- */

export default function App() {
  // screen: "landing" | "login" | "register"
  const [screen, setScreen] = useState("landing");

  const [toast, setToast] = useState(null);
  const [sliderResetKey, setSliderResetKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const acceptButtonRef = useRef(null);

  const isToastOpen = Boolean(toast);

  useEffect(() => {
    if (!isToastOpen) return;
    const t = window.setTimeout(() => acceptButtonRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [isToastOpen]);

  const closeToast = () => {
    setToast(null);
    setSliderResetKey((k) => k + 1);
    setLoading(false);
  };

  // Navegación desde sliders (no toast aquí: navega directo)
  const goLogin = () => setScreen("login");
  const goRegister = () => setScreen("register");

  // Submit handlers (demo). Aquí luego conectas tu API.
  const submitLogin = ({ email }) => {
    setLoading(true);
    setToast({ title: "Iniciar sesión", message: `Validando credenciales para ${email}...` });
  };

  const submitRegister = ({ email }) => {
    setLoading(true);
    setToast({ title: "Registro", message: `Creando cuenta para ${email}...` });
  };

  return (
    <ScreenShell>
      {isToastOpen ? <div aria-hidden="true" className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]" /> : null}

      <ActionToast
        open={isToastOpen}
        title={toast?.title ?? ""}
        message={toast?.message ?? ""}
        onAccept={closeToast}
        acceptButtonRef={acceptButtonRef}
      />

      <div
        className={[
          "transition-opacity duration-300",
          isToastOpen ? "pointer-events-none opacity-90" : "opacity-100",
        ].join(" ")}
      >
        {screen === "landing" ? (
          <LandingScreen
            onGoLogin={goLogin}
            onGoRegister={goRegister}
            sliderResetKey={sliderResetKey}
            disabled={isToastOpen}
          />
        ) : screen === "login" ? (
          <LoginScreen
            onBack={() => setScreen("landing")}
            onSubmit={submitLogin}
            onGoRegister={() => setScreen("register")}
            loading={loading}
          />
        ) : (
          <RegisterScreen
            onBack={() => setScreen("landing")}
            onSubmit={submitRegister}
            onGoLogin={() => setScreen("login")}
            loading={loading}
          />
        )}
      </div>
    </ScreenShell>
  );
}