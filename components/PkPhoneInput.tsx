"use client";

import {
  formatPkNationalDisplay,
  toPkLocal,
  toPkNationalDigits,
} from "@/lib/phone";

type Props = {
  value: string;
  onChange: (localPhone: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
};

/** Pakistan-only phone field: flag +92 | XXX-XXXXXXX → stores 03XXXXXXXXX */
export default function PkPhoneInput({
  value,
  onChange,
  required,
  disabled,
  id,
  name,
  className = "",
}: Props) {
  const display = formatPkNationalDisplay(value);

  function handleChange(raw: string) {
    const next = toPkNationalDigits(raw);
    if (next.length === 0) {
      onChange("");
      return;
    }
    onChange(toPkLocal(next));
  }

  return (
    <div
      className={`flex overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[#a67c52] focus-within:ring-1 focus-within:ring-[#a67c52]/40 ${className}`}
    >
      <div
        className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 bg-[#f4f6f8] px-3 text-sm text-[#15202b]"
        aria-hidden
      >
        <span className="text-base leading-none" title="Pakistan">
          🇵🇰
        </span>
        <span className="font-medium tabular-nums">+92</span>
      </div>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        placeholder="300-1234567"
        maxLength={11}
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#15202b] outline-none placeholder:text-slate-400 disabled:opacity-60"
        pattern="3[0-9]{2}-?[0-9]{0,7}"
        title="Pakistani mobile: 300-1234567"
      />
    </div>
  );
}
