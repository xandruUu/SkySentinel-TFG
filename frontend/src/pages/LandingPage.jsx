import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      
      {/* LOGO / TÍTULO */}
      <h1 className="text-4xl font-black text-primary mb-4">
        SkySentinel
      </h1>

      <p className="text-muted mb-10 max-w-md">
        Tu radar aéreo personal. Detecta aeronaves, crea alertas y sigue el tráfico en tiempo real.
      </p>

      {/* BOTONES */}
      <div className="w-full max-w-xs space-y-4">
        
        <button
          onClick={() => navigate("/login")}
          className="w-full py-3 rounded-2xl bg-primary text-white font-semibold shadow-md hover:opacity-90 transition"
        >
          Iniciar sesión
        </button>

        <button
          onClick={() => navigate("/register")}
          className="w-full py-3 rounded-2xl border border-primary text-primary font-semibold hover:bg-primary/5 transition"
        >
          Crear cuenta
        </button>

      </div>

    </div>
  );
}