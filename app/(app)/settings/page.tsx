"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
} from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

type CatalogItem = {
  id: number;
  name: string;
  code: string;
  default_rate: string;
  sort_order: number;
  is_active: boolean;
};

export default function SettingsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [drafts, setDrafts] = useState<
    Record<number, { name: string; default_rate: string; is_active: boolean }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listCatalogItems();
      setItems(data);
      const next: Record<
        number,
        { name: string; default_rate: string; is_active: boolean }
      > = {};
      for (const item of data) {
        next[item.id] = {
          name: item.name,
          default_rate: String(item.default_rate ?? "0"),
          is_active: item.is_active,
        };
      }
      setDrafts(next);
    } catch {
      setError("Could not load catalog rates. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateDraft(
    id: number,
    patch: Partial<{ name: string; default_rate: string; is_active: boolean }>
  ) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function saveItem(id: number) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setError("");
    setMessage("");
    try {
      const { data } = await updateCatalogItem(id, {
        name: draft.name.trim(),
        default_rate: Number(draft.default_rate || 0).toFixed(2),
        is_active: draft.is_active,
      });
      setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          name: data.name,
          default_rate: String(data.default_rate ?? "0"),
          is_active: data.is_active,
        },
      }));
      setMessage(`Saved ${data.name}.`);
    } catch {
      setError("Failed to save item.");
    } finally {
      setSavingId(null);
    }
  }

  async function deactivateItem(id: number) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    if (!confirm(`Hide "${item.name}" from new bookings?`)) return;
    setSavingId(id);
    setError("");
    setMessage("");
    try {
      await deleteCatalogItem(id);
      await load();
      setMessage(`Deactivated ${item.name}.`);
    } catch {
      setError("Failed to deactivate item.");
    } finally {
      setSavingId(null);
    }
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Item name is required.");
      return;
    }
    setSavingId("new");
    setError("");
    setMessage("");
    try {
      const sort_order =
        items.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;
      await createCatalogItem({
        name: newName.trim(),
        default_rate: Number(newRate || 0).toFixed(2),
        sort_order,
        is_active: true,
      });
      setNewName("");
      setNewRate("");
      await load();
      setMessage("New item added.");
    } catch {
      setError("Failed to add item.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <PageHeader
        title="Settings — Item rates"
        description="Set default rates for each suit/design. New bookings pick these up automatically."
      />

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

      <section className="panel mb-6 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading rates…
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No catalog items yet. Add one below.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Default rate</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const draft = drafts[item.id] || {
                    name: item.name,
                    default_rate: String(item.default_rate),
                    is_active: item.is_active,
                  };
                  return (
                    <tr key={item.id} className={!item.is_active ? "opacity-60" : ""}>
                      <td>
                        <input
                          value={draft.name}
                          onChange={(e) =>
                            updateDraft(item.id, { name: e.target.value })
                          }
                          className="input-pro"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          {item.code}
                        </p>
                      </td>
                      <td className="w-36">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.default_rate}
                          onChange={(e) =>
                            updateDraft(item.id, {
                              default_rate: e.target.value,
                            })
                          }
                          className="input-pro"
                        />
                      </td>
                      <td>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={draft.is_active}
                            onChange={(e) =>
                              updateDraft(item.id, {
                                is_active: e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#a67c52]"
                          />
                          {draft.is_active ? "Yes" : "No"}
                        </label>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={savingId === item.id}
                            onClick={() => saveItem(item.id)}
                            className="btn-primary px-2 py-1 text-xs"
                          >
                            {savingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Save
                          </button>
                          {item.is_active ? (
                            <button
                              type="button"
                              disabled={savingId === item.id}
                              onClick={() => deactivateItem(item.id)}
                              className="btn-secondary px-2 py-1 text-xs text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                              Hide
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form onSubmit={addItem} className="panel space-y-4 p-6 shadow-sm">
        <h2 className="font-serif text-xl text-[#15202b]">Add new item</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-500">
              Name
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Waistcoat Deluxe"
              className="input-pro"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-500">
              Default rate
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="0"
              className="input-pro"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingId === "new"}
          className="btn-primary"
        >
          {savingId === "new" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add item
        </button>
      </form>
    </div>
  );
}
