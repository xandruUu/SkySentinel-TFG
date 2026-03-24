export default function AppMark({ size = 96 }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(circle_at_50%_35%,rgba(37,99,235,0.18),transparent_70%)] blur-2xl"
      />

      <img
        src="/logo1.svg"
        alt="SkySentinel logo"
        className="relative h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(30,58,138,0.2)]"
      />
    </div>
  );
}