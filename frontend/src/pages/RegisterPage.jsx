import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ScreenShell from "../shared/ui/ScreenShell.jsx";
import Card from "../shared/ui/Card.jsx";
import TextInput from "../shared/ui/TextInput.jsx";
import PrimaryButton from "../shared/ui/PrimaryButton.jsx";
import GhostButton from "../shared/ui/GhostButton.jsx";
import HeaderBar from "../widgets/HeaderBar.jsx";
import { useAuth } from "../features/auth/useAuth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passOk = pass.trim().length >= 8;
  const match = pass === pass2 && pass2.length > 0;
  const usernameOk = username.trim().length >= 3;
  const nameOk = firstName.trim().length >= 2;
  const canSubmit = email.trim().length > 3 && usernameOk && nameOk && passOk && match;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setErrorMsg("");
    setSubmitting(true);

    try {
      await register({
        email,
        password: pass,
        username,
        firstName,
        lastName,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "No se ha podido completar el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell>
      <Card>
        <HeaderBar title="Crear cuenta" onBack={() => navigate("/", { replace: true })} />

        <div className="mt-6">
          <h2 className="text-2xl font-bold text-primary">Crea tu cuenta</h2>
          <p className="mt-2 text-sm text-muted">
            Configura tu perfil para guardar alertas y consultar aeronaves detectadas.
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
            label="Nombre"
            value={firstName}
            onChange={setFirstName}
            placeholder="Tu nombre"
            autoComplete="given-name"
          />

          <TextInput
            label="Apellidos"
            value={lastName}
            onChange={setLastName}
            placeholder="Tus apellidos"
            autoComplete="family-name"
          />

          <TextInput
            label="Nombre de usuario"
            value={username}
            onChange={setUsername}
            placeholder="xandru"
            autoComplete="username"
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
            placeholder="Mínimo 8 caracteres"
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

          <PrimaryButton type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Creando..." : "Crear cuenta"}
          </PrimaryButton>
        </form>

        <div className="mt-5 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-secondary hover:underline">
            Iniciar sesión
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