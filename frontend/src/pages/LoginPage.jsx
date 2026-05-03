import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ScreenShell from "../shared/ui/ScreenShell.jsx";
import Card from "../shared/ui/Card.jsx";
import TextInput from "../shared/ui/TextInput.jsx";
import PrimaryButton from "../shared/ui/PrimaryButton.jsx";
import GhostButton from "../shared/ui/GhostButton.jsx";
import HeaderBar from "../widgets/HeaderBar.jsx";
import { useAuth } from "../features/auth/useAuth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = email.trim().length > 3 && pass.trim().length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setErrorMsg("");
    setSubmitting(true);

    try {
      await login({ email, password: pass });

      // Importante: replace => el login NO queda en el historial
      navigate("/app/map", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "No se ha podido iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell>
      <Card>
        <HeaderBar title="Iniciar sesión" onBack={() => navigate("/", { replace: true })} />

        <div className="mt-6">
          <h2 className="text-2xl font-bold text-primary">Bienvenido de nuevo</h2>
          <p className="mt-2 text-sm text-muted">
            Accede a tu perfil de spotter y tus seguimientos.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-2xl bg-card p-4 text-sm ring-1 ring-primary/10">
            <p className="font-semibold text-ink">Error</p>
            <p className="mt-1 text-muted">{errorMsg}</p>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <TextInput
            label="Correo electrónico"
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

          <PrimaryButton type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </PrimaryButton>
        </form>

        <div className="mt-5 text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-semibold text-secondary hover:underline">
            Crear cuenta
          </Link>
        </div>

        <div className="mt-4">
          <GhostButton type="button" onClick={() => navigate("/", { replace: true })}>
            Volver al inicio
          </GhostButton>
        </div>
      </Card>
    </ScreenShell>
  );
}
