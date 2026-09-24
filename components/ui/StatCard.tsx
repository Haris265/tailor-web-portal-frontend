import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { KeyboardEvent } from "react";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  href,
  onClick,
  active,
}: Props) {
  const interactive = Boolean(href || onClick);

  const className = [
    "panel block w-full p-4 text-left transition",
    accent ? "border-[rgba(166,124,82,0.35)] bg-gradient-to-br from-white to-[#faf6f0]" : "",
    interactive
      ? "cursor-pointer hover:border-[rgba(166,124,82,0.45)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a67c52]"
      : "",
    active ? "ring-2 ring-[rgba(166,124,82,0.45)] border-[rgba(166,124,82,0.4)]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {Icon ? (
          <span className="rounded-lg bg-[#f4f6f8] p-1.5 text-[#a67c52]">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-serif text-2xl text-[#15202b]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      {interactive ? (
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[#a67c52]">
          Click to view
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
        className={className}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
