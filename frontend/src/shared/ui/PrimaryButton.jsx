export default function PrimaryButton({
  children,
  variant = "radar",
  onClick,
  type = "button",
  disabled = false,
}) {
  const styles =
    variant === "secondary"
      ? "bg-secondary text-white shadow-[0_14px_40px_rgba(37,99,235,0.28)]"
      : "bg-radar text-white shadow-[0_14px_40px_rgba(255,122,0,0.28)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${styles} ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-95"
      }`}
    >
      {children}
    </button>
  );
}