"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createCustomer,
  createOrder,
  getCustomer,
  listCatalogItems,
  listCustomers,
  updateCustomer,
} from "@/lib/api";
import {
  emptyMeasurementForm,
  formatRs,
  measurementFromApi,
  measurementPayload,
} from "@/lib/constants";
import { isValidPkMobile, PK_PHONE_ERROR, toPkLocal } from "@/lib/phone";
import MeasurementFormSections from "@/components/MeasurementFormSections";
import PkPhoneInput from "@/components/PkPhoneInput";
import PageHeader from "@/components/ui/PageHeader";

type Customer = {
  id: number;
  serial_number: string;
  name: string;
  phone: string;
  address?: string;
  measurement?: Record<string, unknown> | null;
};

type LineItem = {
  item_type: string;
  item_name: string;
  qty: string;
  rate: string;
  sort_order: number;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCustomer = searchParams.get("customer") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mode, setMode] = useState<"existing" | "new">(
    presetCustomer ? "existing" : "new"
  );
  const [customerId, setCustomerId] = useState(presetCustomer);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bookingDate, setBookingDate] = useState(todayISO);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [measForm, setMeasForm] = useState(emptyMeasurementForm);
  const [items, setItems] = useState<LineItem[]>([]);
  const [advancePaid, setAdvancePaid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listCustomers(), listCatalogItems({ active: 1 })])
      .then(([customersRes, catalogRes]) => {
        setCustomers(customersRes.data);
        setItems(
          (catalogRes.data || []).map(
            (
              row: {
                code: string;
                name: string;
                default_rate: string | number;
                sort_order: number;
              },
              index: number
            ) => ({
              item_type: row.code,
              item_name: row.name,
              qty: "",
              rate:
                Number(row.default_rate) > 0 ? String(row.default_rate) : "",
              sort_order: row.sort_order ?? index,
            })
          )
        );
      })
      .catch(() =>
        setLoadError(
          "Could not load customers or rates. Is the backend running?"
        )
      );
  }, []);

  useEffect(() => {
    if (presetCustomer) {
      setMode("existing");
      setCustomerId(presetCustomer);
    }
  }, [presetCustomer]);

  useEffect(() => {
    if (mode !== "existing" || !customerId) return;
    getCustomer(customerId)
      .then(({ data }) => {
        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setMeasForm(measurementFromApi(data.measurement));
      })
      .catch(() => {
        /* keep form */
      });
  }, [mode, customerId]);

  const total = useMemo(() => {
    return items.reduce((sum, row) => {
      const qty = Number(row.qty) || 0;
      const rate = Number(row.rate) || 0;
      return sum + qty * rate;
    }, 0);
  }, [items]);

  const balance = useMemo(() => {
    const advance = Number(advancePaid) || 0;
    return Math.max(total - advance, 0);
  }, [total, advancePaid]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  async function resolveCustomerId(): Promise<number> {
    const localPhone = toPkLocal(phone);
    if (!isValidPkMobile(localPhone)) {
      throw new Error(PK_PHONE_ERROR);
    }

    if (mode === "existing") {
      if (!customerId) throw new Error("Select a customer.");
      await updateCustomer(customerId, {
        name: name.trim(),
        phone: localPhone,
        address: address.trim(),
      });
      return Number(customerId);
    }

    if (!name.trim()) {
      throw new Error("Customer name and phone are required.");
    }
    const { data } = await createCustomer({
      name: name.trim(),
      phone: localPhone,
      address: address.trim(),
    });
    return data.id;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const resolvedId = await resolveCustomerId();
      const payloadItems = items
        .map((row, index) => ({
          item_type: row.item_type,
          item_name: row.item_name,
          qty: Number(row.qty || 0).toFixed(2),
          rate: Number(row.rate || 0).toFixed(2),
          sort_order: index,
        }))
        .filter((row) => Number(row.qty) > 0);

      const { data } = await createOrder({
        customer: resolvedId,
        booking_date: bookingDate,
        delivery_date: deliveryDate,
        advance_paid: Number(advancePaid || 0).toFixed(2),
        status: "pending",
        measurement: measurementPayload(measForm),
        items: payloadItems,
      });
      router.push(`/orders/${data.id}/slip`);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not create the booking. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader
        title="New booking"
        description="Follow the bill book: customer, measurements, items, then print both slips."
      />

      {loadError ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="panel space-y-5 p-6 shadow-sm">
          <h2 className="font-serif text-xl text-[#15202b]">1. Customer & dates</h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                mode === "new"
                  ? "bg-[#15202b] text-white"
                  : "bg-[#f4f6f8] text-slate-600"
              }`}
            >
              New customer
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                mode === "existing"
                  ? "bg-[#15202b] text-white"
                  : "bg-[#f4f6f8] text-slate-600"
              }`}
            >
              Existing customer
            </button>
          </div>

          {mode === "existing" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Customer
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input-pro"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.serial_number} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Customer name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-pro"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Customer contact
              </label>
              <PkPhoneInput required value={phone} onChange={setPhone} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Address (optional)
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-pro"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Date of booking
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="input-pro"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Date of delivery
              </label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="input-pro"
              />
            </div>
          </div>
        </section>

        <section className="panel space-y-5 p-6 shadow-sm">
          <h2 className="font-serif text-xl text-[#15202b]">
            2. Measurement slip
          </h2>
          <MeasurementFormSections form={measForm} onChange={setMeasForm} />
        </section>

        <section className="panel space-y-5 p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-serif text-xl text-[#15202b]">
              3. Customer slip items
            </h2>
            <p className="text-xs text-slate-500">
              Rates from Settings — change qty; rate is prefilled.
            </p>
          </div>
          {items.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No active catalog items. Add rates in Settings first.
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Items</th>
                  <th className="w-24 py-2 pr-3">Qty</th>
                  <th className="w-28 py-2 pr-3">Rate</th>
                  <th className="w-28 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => {
                  const amount =
                    (Number(row.qty) || 0) * (Number(row.rate) || 0);
                  return (
                    <tr
                      key={row.item_type}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2 pr-3 font-medium text-[#15202b]">
                        {row.item_name}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.qty}
                          onChange={(e) =>
                            updateItem(index, { qty: e.target.value })
                          }
                          className="input-pro"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.rate}
                          onChange={(e) =>
                            updateItem(index, { rate: e.target.value })
                          }
                          className="input-pro"
                        />
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatRs(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-[#f4f6f8] px-4 py-3">
              <p className="text-sm text-slate-500">Total</p>
              <p className="font-serif text-2xl text-[#15202b]">
                {formatRs(total)}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Advance
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="input-pro"
              />
            </div>
            <div className="rounded-lg bg-[#f4f6f8] px-4 py-3">
              <p className="text-sm text-slate-500">Balance</p>
              <p className="font-serif text-2xl text-[#15202b]">
                {formatRs(balance)}
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save booking &amp; open slips
        </button>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <NewOrderForm />
    </Suspense>
  );
}
