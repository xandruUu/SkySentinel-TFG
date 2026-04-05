import { useAuth } from "../../features/auth/useAuth.js";
import { useFavorites } from "../../features/favorites/useFavorites.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="rounded-[32px] bg-white/75 p-6 backdrop-blur-sm ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
        <h1 className="text-2xl font-black tracking-tight text-primary">Perfil</h1>

        <div className="mt-4 space-y-2 text-sm text-ink">
          <p>
            <span className="font-semibold">Email:</span> {user?.email}
          </p>
          <p>
            <span className="font-semibold">Rol:</span> {user?.role}
          </p>
          <p>
            <span className="font-semibold">Usuario ID:</span> {user?.user_id}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] bg-white/75 p-6 backdrop-blur-sm ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
        <h2 className="text-lg font-black text-primary">Favoritos</h2>
        <p className="mt-1 text-sm text-muted">
          Guarda aeronaves por icao24 (y callsign si llega).
        </p>

        {favorites.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía no tienes favoritos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-primary/10">
            {favorites.map((f) => (
              <li key={f.icao24} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{f.callsign || "Sin callsign"}</p>
                  <p className="text-xs text-muted">{f.icao24}</p>
                </div>
                <button
                  onClick={() => toggleFavorite({ icao24: f.icao24, callsign: f.callsign })}
                  className="rounded-2xl bg-card px-3 py-2 text-sm font-bold ring-1 ring-primary/10 hover:ring-secondary/20"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
