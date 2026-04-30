export default function ScreenShell({ children }) {
  return (
    <main className="h-dvh overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top,#eaf2ff_0%,#ffffff_45%,#fff7ef_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center py-4">
        {children}
      </div>
    </main>
  );
}