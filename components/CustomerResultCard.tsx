import Link from "next/link";
import { MEASUREMENT_FIELDS } from "@/lib/constants";

type Measurement = {
  length?: number;
  chest?: number;
  waist?: number;
  shoulder?: number;
  sleeve?: number;
  collar?: number;
  bottom_shalwar?: number;
  notes?: string;
};

type Customer = {
  id: number;
  serial_number: string;
  name: string;
  phone: string;
  measurement?: Measurement | null;
};

export default function CustomerResultCard({ customer }: { customer: Customer }) {
  const m = customer.measurement;

  return (
    <Link
      href={`/customers/${customer.id}`}
      className="panel block p-5 transition hover:border-[rgba(166,124,82,0.4)] hover:shadow-md"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-serif text-xl text-[#15202b]">{customer.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>
        </div>
        <span className="rounded-md bg-[#15202b] px-2.5 py-1 text-xs font-medium tracking-wide text-white">
          {customer.serial_number}
        </span>
      </div>

      {m ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEASUREMENT_FIELDS.map(({ name: key, label }) => (
              <div key={key} className="rounded-lg bg-[#f4f6f8] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-0.5 text-lg font-medium text-[#15202b]">
                  {(m as Record<string, number | string | undefined>)[key] ?? "—"}
                </p>
              </div>
            ))}
          </div>
          {m.notes ? (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Notes:</span> {m.notes}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">No measurements saved yet.</p>
      )}
    </Link>
  );
}
