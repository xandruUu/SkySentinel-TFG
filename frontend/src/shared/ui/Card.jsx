export default function Card({ children }) {
  return (
    <section className="w-full max-w-xl rounded-[32px] bg-white/75 p-6 backdrop-blur-sm ring-1 ring-primary/10 shadow-[0_24px_80px_rgba(30,58,138,0.12)] sm:p-8">
      {children}
    </section>
  );
}