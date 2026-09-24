"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { searchCustomers } from "@/lib/api";

export type CustomerSuggestion = {
  id: number;
  serial_number: string;
  name: string;
  phone: string;
  measurement?: Record<string, unknown> | null;
};

type Props = {
  placeholder?: string;
  /** Called when user presses Enter without picking a suggestion (full search). */
  onSubmitSearch?: (query: string, results: CustomerSuggestion[]) => void;
  /** Navigate to profile on pick (default true). */
  navigateOnSelect?: boolean;
  onSelect?: (customer: CustomerSuggestion) => void;
  className?: string;
  initialQuery?: string;
};

const SUGGESTION_LIMIT = 8;
const MIN_CHARS = 1;
const DEBOUNCE_MS = 250;

export default function CustomerSearch({
  placeholder = "Search name, serial, or phone…",
  onSubmitSearch,
  navigateOnSelect = true,
  onSelect,
  className = "",
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await searchCustomers(q.trim());
      const list = (data as CustomerSuggestion[]).slice(0, SUGGESTION_LIMIT);
      setSuggestions(list);
      setOpen(true);
      setHighlight(list.length ? 0 : -1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(customer: CustomerSuggestion) {
    setQuery(customer.name);
    setOpen(false);
    setHighlight(-1);
    onSelect?.(customer);
    if (navigateOnSelect) {
      router.push(`/customers/${customer.id}`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (highlight >= 0 && suggestions[highlight]) {
      pick(suggestions[highlight]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await searchCustomers(q);
      const list = data as CustomerSuggestion[];
      setSuggestions(list.slice(0, SUGGESTION_LIMIT));
      setOpen(list.length > 0);
      onSubmitSearch?.(q, list);
    } catch {
      onSubmitSearch?.(q, []);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="input-pro with-icons"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
          ) : null}
        </div>
        <button type="submit" className="btn-primary shrink-0" disabled={!query.trim()}>
          Search
        </button>
      </form>

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(c)}
                className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition ${
                  i === highlight ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#15202b]">{c.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.phone}</p>
                </div>
                <span className="shrink-0 rounded-md bg-[#f4f6f8] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#a67c52]">
                  {c.serial_number}
                </span>
              </button>
            </li>
          ))}
          {suggestions.length >= SUGGESTION_LIMIT ? (
            <li className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
              Showing top {SUGGESTION_LIMIT} — press Search for all matches
            </li>
          ) : null}
        </ul>
      ) : null}

      {open && !loading && query.trim().length >= MIN_CHARS && suggestions.length === 0 ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500 shadow-lg">
          No customers found. Try serial number or phone.
        </div>
      ) : null}
    </div>
  );
}
