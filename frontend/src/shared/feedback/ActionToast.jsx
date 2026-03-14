import { useEffect, useId } from "react";

export default function ActionToast({
  open,
  title,
  message,
  onAccept,
  acceptButtonRef,
}) {
  const id = useId();

  useEffect(() => {
    if (open && acceptButtonRef?.current) {
      acceptButtonRef.current.focus();
    }
  }, [open, acceptButtonRef]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="alertdialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        className="pointer-events-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.2)] ring-1 ring-primary/10"
      >
        <h3 id={`${id}-title`} className="text-lg font-bold text-primary">
          {title}
        </h3>

        <p id={`${id}-desc`} className="mt-2 text-sm text-muted">
          {message}
        </p>

        <div className="mt-4 flex justify-end">
          <button
            ref={acceptButtonRef}
            type="button"
            onClick={onAccept}
            className="rounded-2xl bg-radar px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,122,0,0.28)] transition hover:opacity-95"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}