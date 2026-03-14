import { useState } from "react";
import ScreenShell from "../shared/ui/ScreenShell.jsx";
import Card from "../shared/ui/Card.jsx";
import TextInput from "../shared/ui/TextInput.jsx";
import PrimaryButton from "../shared/ui/PrimaryButton.jsx";
import GhostButton from "../shared/ui/GhostButton.jsx";
import HeaderBar from "../widgets/HeaderBar.jsx";

export default function RegisterPage({
  onBack,
  onSubmit,
  onGoLogin,
  loading,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const passOk = pass.trim().length >= 6;
  const match = pass === pass2 && pass2.length > 0;

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 3 &&
    passOk &&
    match;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onSubmit({ name, email, pass });
  };

  return (
    <ScreenShell>
      <Card>
        <HeaderBar title="Crear cuenta" onBack={onBack} />

        <div className="mt-6">
          <h2 className="text-2xl font-bold text-primary">Crea tu cuenta</h2>
          <p className="mt-2 text-sm text-muted">
            Guarda avistamientos, alertas y aeronaves favoritas.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <TextInput
            label="Nombre"
            value={name}
            onChange={setName}
            placeholder="Tu nombre"
            autoComplete="name"
          />

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
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />

          <TextInput
            label="Repite la contraseña"
            type="password"
            value={pass2}
            onChange={setPass2}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />

          <div className="rounded-2xl bg-card p-4 text-sm text-muted ring-1 ring-primary/10">
            <p className="font-semibold text-ink">Requisitos</p>
            <ul className="mt-2 space-y-1">
              <li>• Contraseña ≥ 6 caracteres</li>
              <li>• Las contraseñas coinciden</li>
            </ul>
          </div>

          <PrimaryButton type="submit" disabled={!canSubmit || loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </PrimaryButton>
        </form>

        <div className="mt-5 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onGoLogin}
            className="font-semibold text-secondary hover:underline"
          >
            Iniciar sesión
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