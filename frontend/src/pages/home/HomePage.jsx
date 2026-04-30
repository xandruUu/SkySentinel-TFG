import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <section className="rounded-[2rem] bg-primary p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          SkySentinel
        </p>

        <div className="mt-4 grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Radar aéreo y alertas personalizadas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Consulta aeronaves en tiempo real y configura tus avisos desde el panel de filtros del mapa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/app/map")}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-primary shadow-sm transition hover:bg-white/90"
          >
            Acceder al mapa
          </button>
        </div>
      </section>
    </main>
  );
}