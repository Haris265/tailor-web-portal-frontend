"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  Scissors,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders/new", label: "New Booking", icon: ClipboardPlus },
  { href: "/settings", label: "Settings", icon: Settings },
];

type Props = {
  open?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ open = false, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`print:hidden fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-[#fafbfc] text-[#15202b] transition-transform duration-200 ease-out md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(166,124,82,0.12)] text-[#a67c52] shadow-sm">
          <Scissors className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-serif text-lg leading-tight tracking-tight text-[#15202b]">
            KJ COLLECTIONS
          </p>
          <p className="text-[11px] font-medium text-slate-500">Tailor Portal</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[rgba(166,124,82,0.12)] text-[#15202b] shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-[#15202b]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-[#a67c52]" : ""}`}
                strokeWidth={1.75}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
