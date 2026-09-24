"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createCustomer } from "@/lib/api";
import { isValidPkMobile, PK_PHONE_ERROR, toPkLocal } from "@/lib/phone";
import PkPhoneInput from "@/components/PkPhoneInput";
import PageHeader, { BackLink } from "@/components/ui/PageHeader";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const localPhone = toPkLocal(phone);
    if (!isValidPkMobile(localPhone)) {
      setError(PK_PHONE_ERROR);
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await createCustomer({
        name: name.trim(),
        phone: localPhone,
      });
      router.push(`/customers/${data.id}?tab=measurements`);
    } catch {
      setError("Could not save customer. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <div className="mb-4">
        <BackLink href="/customers" label="All customers" />
      </div>
      <PageHeader
        title="New customer"
        description="Register name and phone. Add measurements on the next step."
      />

      <form onSubmit={handleSubmit} className="panel space-y-4 p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">
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
          <label className="mb-1.5 block text-sm font-medium text-slate-400">
            Phone
          </label>
          <PkPhoneInput required value={phone} onChange={setPhone} />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save &amp; add measurements
          </button>
          <Link href="/customers" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
