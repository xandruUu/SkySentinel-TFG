import { useId } from "react";

export default function TextInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-2xl bg-white/80 px-4 py-3 text-[15px] text-ink ring-1 ring-primary/10 shadow-[0_12px_30px_rgba(30,58,138,0.08)] outline-none transition focus:ring-4 focus:ring-secondary/20"
      />
    </div>
  );
}