"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Printer, Trash2 } from "lucide-react";
import {
  createMeasurement,
  deleteCustomer,
  getCustomer,
  listOrders,
  updateCustomer,
  updateMeasurement,
  updateOrder,
} from "@/lib/api";
import {
  formatRs,
  emptyMeasurementForm,
  measurementFromApi,
  measurementPayload,
} from "@/lib/constants";
import { isValidPkMobile, PK_PHONE_ERROR, toPkLocal } from "@/lib/phone";
import MeasurementFormSections from "@/components/MeasurementFormSections";
import PkPhoneInput from "@/components/PkPhoneInput";
import PageHeader, { BackLink } from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

type Tab = "details" | "measurements" | "sales";

type Customer = {
  id: number;
  serial_number: string;
  name: string;
  phone: string;
  address?: string;
  measurement?: { id: number } & Record<string, unknown> | null;
};

type Order = {
  id: number;
  order_number: string;
  sr_no?: number;
  booking_date: string;
  delivery_date: string;
  total_amount: string;
  advance_paid: string;
  balance_due: string;
  status: string;
};

function CustomerDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;

  const initialTab = (searchParams.get("tab") as Tab) || "details";
  const [tab, setTab] = useState<Tab>(
    ["details", "measurements", "sales"].includes(initialTab)
      ? initialTab
      : "details"
  );

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [measForm, setMeasForm] = useState(emptyMeasurementForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [{ data: cust }, { data: ords }] = await Promise.all([
        getCustomer(id),
        listOrders({ customer: id }),
      ]);
      setCustomer(cust);
      setName(cust.name);
      setPhone(cust.phone);
      setAddress(cust.address || "");
      setOrders(ords);
      setMeasForm(measurementFromApi(cust.measurement));
    } catch {
      setError("Could not load customer.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t && ["details", "measurements", "sales"].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  function switchTab(next: Tab) {
    setTab(next);
    setMessage("");
    setError("");
    router.replace(`/customers/${id}?tab=${next}`, { scroll: false });
  }

  const salesTotal = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const localPhone = toPkLocal(phone);
    if (!isValidPkMobile(localPhone)) {
      setError(PK_PHONE_ERROR);
      setSaving(false);
      return;
    }
    try {
      const { data } = await updateCustomer(id, {
        name: name.trim(),
        phone: localPhone,
        address: address.trim(),
      });
      setCustomer((prev) => (prev ? { ...prev, ...data } : data));
      setPhone(data.phone || localPhone);
      setMessage("Customer details saved.");
    } catch {
      setError("Failed to update customer.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMeasurements(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = measurementPayload(measForm);

    try {
      if (customer?.measurement?.id) {
        const { data } = await updateMeasurement(customer.measurement.id, payload);
        setCustomer((prev) => (prev ? { ...prev, measurement: data } : prev));
        setMeasForm(measurementFromApi(data));
      } else {
        const { data } = await createMeasurement({
          customer: Number(id),
          ...payload,
        });
        setCustomer((prev) => (prev ? { ...prev, measurement: data } : prev));
        setMeasForm(measurementFromApi(data));
      }
      setMessage("Measurements saved.");
    } catch {
      setError("Failed to save measurements.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!customer) return;
    if (
      !confirm(
        `Delete ${customer.name}? All orders and measurements will be removed.`
      )
    ) {
      return;
    }
    try {
      await deleteCustomer(customer.id);
      router.push("/customers");
    } catch {
      setError("Failed to delete customer.");
    }
  }

  async function setOrderStatus(orderId: number, status: string) {
    try {
      const { data } = await updateOrder(orderId, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data } : o))
      );
    } catch {
      setError("Failed to update order status.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Customer not found."}
        </p>
        <Link href="/customers" className="btn-secondary mt-4 inline-flex">
          Back to customers
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "measurements", label: "Measurements" },
    { id: "sales", label: "Sales" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-4">
        <BackLink href="/customers" label="All customers" />
      </div>
      <PageHeader
        title={customer.name}
        description={`${customer.serial_number} · ${customer.phone}`}
        actions={
          <Link
            href={`/orders/new?customer=${customer.id}`}
            className="btn-primary"
          >
            New booking
          </Link>
        }
      />

      <div className="mb-5 flex gap-1 border-b border-[#e2e8f0]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "border-[#a67c52] text-[#15202b]"
                : "border-transparent text-slate-500 hover:text-[#15202b]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {tab === "details" ? (
        <form onSubmit={saveDetails} className="panel space-y-4 p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Serial number
            </label>
            <input
              disabled
              value={customer.serial_number}
              className="input-pro bg-[#f4f6f8]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-pro"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Phone
            </label>
            <PkPhoneInput required value={phone} onChange={setPhone} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-pro"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save details
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-secondary text-red-600 hover:border-red-300 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete customer
            </button>
          </div>
        </form>
      ) : null}

      {tab === "measurements" ? (
        <form onSubmit={saveMeasurements} className="panel space-y-4 p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            {customer.measurement
              ? "Last-known measurements used to prefill new bookings."
              : "No measurements yet — fill in sizes and save."}
          </p>
          <MeasurementFormSections form={measForm} onChange={setMeasForm} />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save measurements
          </button>
        </form>
      ) : null}

      {tab === "sales" ? (
        <div className="space-y-4">
          <div className="panel flex flex-wrap items-center justify-between gap-3 p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customer sales total
              </p>
              <p className="font-serif text-2xl text-[#15202b]">
                {formatRs(salesTotal)}
              </p>
            </div>
            <p className="text-sm text-slate-500">{orders.length} booking(s)</p>
          </div>

          <div className="panel overflow-hidden shadow-sm">
            {orders.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                No bookings yet for this customer.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-pro">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Dates</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="font-medium">
                          {o.sr_no ?? o.order_number}
                        </td>
                        <td className="text-slate-400">
                          {o.booking_date} → {o.delivery_date}
                        </td>
                        <td>
                          <div>{formatRs(o.total_amount)}</div>
                          <div className="text-xs text-slate-400">
                            Bal {formatRs(o.balance_due)}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={o.status} />
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <Link
                              href={`/orders/${o.id}/slip`}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              <Printer className="h-3 w-3" />
                              Slip
                            </Link>
                            {o.status === "pending" ? (
                              <button
                                type="button"
                                onClick={() => setOrderStatus(o.id, "ready")}
                                className="btn-secondary px-2 py-1 text-xs"
                              >
                                Mark ready
                              </button>
                            ) : null}
                            {o.status !== "delivered" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setOrderStatus(o.id, "delivered")
                                }
                                className="btn-secondary px-2 py-1 text-xs"
                              >
                                Delivered
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <CustomerDetailContent />
    </Suspense>
  );
}
