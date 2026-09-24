"use client";

import {
  COAT_PANT_FIELDS,
  READY_SIZE_FIELDS,
  SHIRT_FIELDS,
  STYLE_OPTIONS,
} from "@/lib/constants";

type Props = {
  form: Record<string, string | boolean>;
  onChange: (next: Record<string, string | boolean>) => void;
  disabled?: boolean;
};

function FieldGrid({
  title,
  fields,
  form,
  onChange,
  disabled,
}: {
  title: string;
  fields: ReadonlyArray<{ name: string; label: string; kind?: "text" }>;
  form: Record<string, string | boolean>;
  onChange: (next: Record<string, string | boolean>) => void;
  disabled?: boolean;
}) {
  return (
    <section className="space-y-3">
      <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-[#15202b]">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => {
          const kind = field.kind === "text" ? "text" : "number";
          return (
            <div key={field.name}>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {field.label}
              </label>
              <input
                type={kind}
                min={kind === "number" ? "0" : undefined}
                step={kind === "number" ? "0.01" : undefined}
                disabled={disabled}
                value={String(form[field.name] ?? "")}
                onChange={(e) =>
                  onChange({ ...form, [field.name]: e.target.value })
                }
                className="input-pro"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function MeasurementFormSections({
  form,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="space-y-8">
      <FieldGrid
        title="Shirt & Shalwar Kameez"
        fields={SHIRT_FIELDS}
        form={form}
        onChange={onChange}
        disabled={disabled}
      />
      <FieldGrid
        title="Ready Size"
        fields={READY_SIZE_FIELDS}
        form={form}
        onChange={onChange}
        disabled={disabled}
      />
      <FieldGrid
        title="Coat & Pant"
        fields={COAT_PANT_FIELDS}
        form={form}
        onChange={onChange}
        disabled={disabled}
      />

      <section className="space-y-3">
        <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-[#15202b]">
          Style options
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STYLE_OPTIONS.map((style) => (
            <label
              key={style.name}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-[#15202b]"
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(form[style.name])}
                onChange={(e) =>
                  onChange({ ...form, [style.name]: e.target.checked })
                }
                className="h-5 w-5 accent-[#a67c52]"
              />
              <span>
                {style.label}
                <span className="ml-1 text-slate-400" dir="rtl">
                  {style.labelUrdu}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-400">
          Notes
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={String(form.notes ?? "")}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          className="input-pro"
        />
      </div>
    </div>
  );
}
