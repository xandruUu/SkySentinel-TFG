import { useAuth } from "../../features/auth/useAuth.js";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="rounded-[32px] bg-white/75 p-6 backdrop-blur-sm ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
        <h1 className="text-2xl font-black tracking-tight text-primary">Perfil</h1>

        <div className="mt-4 space-y-2 text-sm text-ink">
          <p>
            <span className="font-semibold">Email:</span> {user?.email || "—"}
          </p>
          <p>
            <span className="font-semibold">Rol:</span> {user?.role || "—"}
          </p>
          <p>
            <span className="font-semibold">Usuario ID:</span> {user?.user_id || "—"}
          </p>
        </div>
      </section>
    </main>
  );
}