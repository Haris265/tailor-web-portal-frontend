export const SHIRT_FIELDS = [
  { name: "length", label: "Length" },
  { name: "chest", label: "Chest" },
  { name: "waist", label: "Waist" },
  { name: "hip", label: "Hip" },
  { name: "shoulder", label: "Shoulder" },
  { name: "sleeve", label: "Sleeves" },
  { name: "collar", label: "Collar" },
  { name: "shalwar_length", label: "Shalwar Length" },
  { name: "bottom_shalwar", label: "Shalwar Bottom" },
  { name: "pajama_length", label: "Pajama Length" },
  { name: "pajama_bottom", label: "Pajama Bottom" },
  { name: "other", label: "Other", kind: "text" as const },
] as const;

export const READY_SIZE_FIELDS = [
  { name: "ready_chest", label: "Chest" },
  { name: "ready_waist", label: "Waist" },
  { name: "ready_hip", label: "Hip" },
  { name: "ready_daman", label: "Daman" },
  { name: "ready_arms", label: "Arms" },
] as const;

export const COAT_PANT_FIELDS = [
  { name: "pant_length", label: "Length" },
  { name: "coat_pant_waist", label: "Waist" },
  { name: "coat_pant_hip", label: "Hip" },
  { name: "inseam_length", label: "Inseam Length" },
  { name: "thigh", label: "Thigh" },
  { name: "knee", label: "Knee" },
  { name: "pant_bottom", label: "Bottom" },
  { name: "coat_length", label: "Coat Length" },
  { name: "fly", label: "Fly" },
  { name: "wc_length", label: "WC Length" },
  { name: "wc_shoulder", label: "WC Shoulder" },
  { name: "half_full_back", label: "Half / Full Back", kind: "text" as const },
] as const;

export const STYLE_OPTIONS = [
  { name: "style_sherwani", label: "Sherwani", labelUrdu: "شیروانی" },
  { name: "style_collar", label: "Collar", labelUrdu: "کالر" },
  { name: "style_cuff_sleeve", label: "Cuff Sleeve", labelUrdu: "کف آستین" },
  { name: "style_gol_sleeve", label: "Gol Sleeve", labelUrdu: "گول آستین" },
  { name: "style_front_pocket", label: "Front Pocket", labelUrdu: "فرنٹ پاکٹ" },
  { name: "style_side_pocket", label: "Side Pocket", labelUrdu: "سائیڈ پاکٹ" },
  { name: "style_shalwar_pocket", label: "Shalwar Pocket", labelUrdu: "شلوار پاکٹ" },
  { name: "style_daman_chowkor", label: "Daman Chowkor", labelUrdu: "دامن چوکور" },
  { name: "style_daman_gol", label: "Daman Gol", labelUrdu: "دامن گول" },
] as const;

export const ORDER_ITEM_TYPES = [
  { value: "simple_suit", label: "Simple Suit" },
  { value: "designing_suit", label: "Designing Suit" },
  { value: "embroidery_suit", label: "Embroidery Suit" },
  { value: "shilling_suit", label: "Shilling Suit" },
  { value: "fabric_amount", label: "Fabric Amount" },
  { value: "west_coat", label: "West Coat" },
  { value: "prince_coat", label: "Prince Coat" },
] as const;

/** Legacy alias — shirt fields shown in compact customer cards. */
export const MEASUREMENT_FIELDS = SHIRT_FIELDS.filter(
  (f) => f.name !== "other"
) as ReadonlyArray<{ name: string; label: string }>;

export const ALL_NUMERIC_MEASUREMENT_FIELDS = [
  ...SHIRT_FIELDS.filter((f) => !("kind" in f && f.kind === "text")),
  ...READY_SIZE_FIELDS,
  ...COAT_PANT_FIELDS.filter((f) => !("kind" in f && f.kind === "text")),
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ready: "Ready",
  delivered: "Delivered",
};

export function formatRs(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return `Rs ${n.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function emptyMeasurementForm(): Record<string, string | boolean> {
  const form: Record<string, string | boolean> = { notes: "" };
  for (const field of [
    ...SHIRT_FIELDS,
    ...READY_SIZE_FIELDS,
    ...COAT_PANT_FIELDS,
  ]) {
    form[field.name] = "";
  }
  for (const style of STYLE_OPTIONS) {
    form[style.name] = false;
  }
  return form;
}

export function measurementFromApi(
  m: Record<string, unknown> | null | undefined
): Record<string, string | boolean> {
  const form = emptyMeasurementForm();
  if (!m) return form;
  for (const field of [
    ...SHIRT_FIELDS,
    ...READY_SIZE_FIELDS,
    ...COAT_PANT_FIELDS,
  ]) {
    const val = m[field.name];
    form[field.name] =
      val === null || val === undefined || val === 0 ? "" : String(val);
  }
  for (const style of STYLE_OPTIONS) {
    form[style.name] = Boolean(m[style.name]);
  }
  form.notes = String(m.notes ?? "");
  return form;
}

export function measurementPayload(
  form: Record<string, string | boolean>
): Record<string, number | string | boolean> {
  const payload: Record<string, number | string | boolean> = {
    notes: String(form.notes ?? "").trim(),
  };
  for (const field of [
    ...SHIRT_FIELDS,
    ...READY_SIZE_FIELDS,
    ...COAT_PANT_FIELDS,
  ]) {
    const kind = "kind" in field ? field.kind : "number";
    const raw = String(form[field.name] ?? "").trim();
    if (kind === "text") {
      payload[field.name] = raw;
    } else {
      payload[field.name] = raw === "" ? 0 : Number(raw);
    }
  }
  for (const style of STYLE_OPTIONS) {
    payload[style.name] = Boolean(form[style.name]);
  }
  return payload;
}

export function emptyOrderItems() {
  return ORDER_ITEM_TYPES.map((item, index) => ({
    item_type: item.value,
    qty: "",
    rate: "",
    sort_order: index,
  }));
}
