import { useState } from "react";
import ScreenShell from "../shared/ui/ScreenShell.jsx";
import Card from "../shared/ui/Card.jsx";
import TextInput from "../shared/ui/TextInput.jsx";
import PrimaryButton from "../shared/ui/PrimaryButton.jsx";
import GhostButton from "../shared/ui/GhostButton.jsx";
import HeaderBar from "../widgets/HeaderBar.jsx";

export default function LoginPage({ onBack, onSubmit, onGoRegister, loading }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const canSubmit = email.trim().length > 3 && pass.trim().length >= 4;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onSubmit({ email, pass });
  };

  return (
    <ScreenShell>
      <Card>
        <HeaderBar title="Iniciar sesión" onBack={onBack} />

        <div className="mt-6">
          <h2 className="text-2xl font-bold text-primary">Bienvenido de nuevo</h2>
          <p className="mt-2 text-sm text-muted">
            Accede a tu perfil de spotter y tus seguimientos.
          </p>
        </div>

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

          <PrimaryButton type="submit" disabled={!canSubmit || loading}>
            {loading ? "Entrando..." : "Entrar"}
          </PrimaryButton>
        </form>

        <div className="mt-5 text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={onGoRegister}
            className="font-semibold text-secondary hover:underline"
          >
            Crear cuenta
          </button>
        </div>

        <div className="mt-4">
          <GhostButton type="button" onClick={onBack}>
            Volver al inicio
          </GhostButton>
        </div>
      </Card>
    </ScreenShell>
  );
}