export default function ScreenShell({ children }) {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,#eaf2ff_0%,#ffffff_45%,#fff7ef_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center">
        {children}
      </div>
    </main>
  );
}