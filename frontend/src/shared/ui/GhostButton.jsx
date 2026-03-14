export default function GhostButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex w-full items-center justify-center rounded-2xl bg-white/70 px-5 py-3 text-sm font-semibold text-primary ring-1 ring-primary/10 transition hover:bg-white"
    >
      {children}
    </button>
  );
}