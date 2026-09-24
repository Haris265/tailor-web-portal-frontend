"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getMe, logout } from "@/lib/api";

export default function AppHeader() {
  const router = useRouter();
  const [username, setUsername] = useState("tailor");
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMe()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username);
      })
      .catch(() => {
        // Keep fallback initial
      });
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  const initial = (username.trim().charAt(0) || "T").toUpperCase();

  return (
    <header className="print:hidden sticky top-0 z-40 flex h-14 shrink-0 items-center justify-end border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={username}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a67c52] text-sm font-semibold text-white shadow-sm ring-2 ring-[rgba(166,124,82,0.25)] transition hover:ring-[rgba(166,124,82,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a67c52]"
        >
          {initial}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <div className="border-b border-slate-100 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Signed in
              </p>
              <p className="truncate text-sm font-semibold text-[#15202b]">
                {username}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#15202b] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
