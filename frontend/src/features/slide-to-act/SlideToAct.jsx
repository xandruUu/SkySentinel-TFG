import { useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "../../shared/lib/clamp.js";

export default function SlideToAct({
  label,
  direction = "ltr",
  accent = "secondary",
  onComplete,
  disabled = false,
}) {
  const HANDLE_PX = 72;
  const trackRef = useRef(null);

  const [trackWidth, setTrackWidth] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);

  const maxX = useMemo(
    () => Math.max(0, trackWidth - HANDLE_PX),
    [trackWidth]
  );

  const handleLeft = useMemo(() => {
    if (direction === "ltr") return progress * maxX;
    return maxX - progress * maxX;
  }, [direction, progress, maxX]);

  const fillWidth = useMemo(
    () => progress * maxX + HANDLE_PX,
    [progress, maxX]
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      setTrackWidth(el.getBoundingClientRect().width);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const doneThreshold = 0.92;

  const finish = () => {
    if (disabled || completed) return;
    setCompleted(true);
    setProgress(1);
    onComplete?.();
  };

  const getProgressFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return 0;

    const rect = el.getBoundingClientRect();
    const raw = clientX - rect.left - HANDLE_PX / 2;
    const pos = clamp(raw, 0, maxX);

    if (maxX === 0) return 0;
    if (direction === "ltr") return pos / maxX;

    return (maxX - pos) / maxX;
  };

  const onPointerDown = (e) => {
    if (disabled || completed) return;
    e.preventDefault();
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging || disabled || completed) return;
    setProgress(getProgressFromClientX(e.clientX));
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);

    if (progress >= doneThreshold) {
      finish();
    } else {
      setProgress(0);
    }

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onKeyDown = (e) => {
    if (disabled || completed) return;

    const step = 0.06;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      finish();
      return;
    }

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const sign = e.key === "ArrowRight" ? 1 : -1;
      const logicalSign = direction === "ltr" ? sign : -sign;
      const next = clamp(progress + logicalSign * step, 0, 1);
      setProgress(next);

      if (next >= doneThreshold) {
        finish();
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setProgress(0);
    }
  };

  const icon = direction === "ltr" ? "→" : "←";

  const thumbClasses =
    accent === "radar"
      ? "bg-gradient-to-br from-solar to-radar shadow-[0_16px_45px_rgba(255,122,0,0.35)]"
      : "bg-gradient-to-br from-secondary to-primary shadow-[0_16px_45px_rgba(37,99,235,0.33)]";

  const fillClasses =
    direction === "ltr"
      ? "left-0 bg-gradient-to-r from-secondary/20 via-secondary/10 to-radar/15"
      : "right-0 bg-gradient-to-l from-radar/20 via-radar/10 to-secondary/15";

  const textOpacity = clamp(1 - progress * 1.35, 0, 1);

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className="relative h-[76px] w-full overflow-hidden rounded-[999px] bg-white/80 ring-1 ring-primary/10 shadow-[0_18px_45px_rgba(30,58,138,0.08)]"
      >
        <div
          className={`absolute top-0 h-full ${fillClasses}`}
          style={{ width: `${fillWidth}px` }}
        />

        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-24 text-center text-sm font-semibold text-ink transition"
          style={{ opacity: textOpacity }}
        >
          {label}
        </div>

        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className={`absolute top-1/2 grid h-[64px] w-[64px] -translate-y-1/2 place-items-center rounded-full text-2xl font-bold text-white transition-transform ${thumbClasses} ${
            dragging ? "scale-105" : "scale-100"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing"}`}
          style={{ left: `${handleLeft}px` }}
        >
          {icon}
        </button>
      </div>
    </div>
  );
}