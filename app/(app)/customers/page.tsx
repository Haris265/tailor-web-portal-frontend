"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { deleteCustomer, listCustomers } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import CustomerSearch, {
  CustomerSuggestion,
} from "@/components/CustomerSearch";

type Customer = {
  id: number;
  serial_number: string;
  name: string;
  phone: string;
  created_at: string;
  measurement?: { id: number } | null;
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listCustomers(search ? { search } : {});
      setCustomers(data);
    } catch {
      setError("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleFullSearch(_q: string, results: CustomerSuggestion[]) {
    setCustomers(results as Customer[]);
    setLoading(false);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete customer.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Customers"
        description="Manage customer records. Search by name, serial, or phone."
        actions={
          <Link href="/customers/new" className="btn-primary w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New customer
          </Link>
        }
      />

      <div className="mb-5">
        <CustomerSearch
          navigateOnSelect
          onSubmitSearch={handleFullSearch}
        />
        <button
          type="button"
          onClick={() => load()}
          className="mt-2 text-xs text-slate-500 hover:text-[#a67c52]"
        >
          Clear search / show all
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="panel overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : customers.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            No customers found.{" "}
            <Link href="/customers/new" className="text-[#a67c52] hover:underline">
              Add one
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-slate-100 md:hidden">
            {customers.map((c) => (
              <div key={c.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#15202b]">{c.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#a67c52]">
                      {c.serial_number}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{c.phone}</p>
                  </div>
                  {c.measurement ? (
                    <span className="badge badge-delivered shrink-0">Saved</span>
                  ) : (
                    <span className="badge badge-pending shrink-0">Missing</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="View"
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#15202b]"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() =>
                      router.push(`/customers/${c.id}?tab=details`)
                    }
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#15202b]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    disabled={deletingId === c.id}
                    onClick={() => handleDelete(c.id, c.name)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Measurements</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-sm text-[#a67c52]">
                      {c.serial_number}
                    </td>
                    <td className="font-medium text-[#15202b]">{c.name}</td>
                    <td className="text-slate-400">{c.phone}</td>
                    <td>
                      {c.measurement ? (
                        <span className="badge badge-delivered">Saved</span>
                      ) : (
                        <span className="badge badge-pending">Missing</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="View"
                          onClick={() => router.push(`/customers/${c.id}`)}
                          className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#15202b]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() =>
                            router.push(`/customers/${c.id}?tab=details`)
                          }
                          className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#15202b]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id, c.name)}
                          className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
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
  );
}
