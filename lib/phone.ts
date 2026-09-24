/** Pakistani mobile helpers: store as 03XXXXXXXXX (11 digits). */

export function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Extract the 10 national digits (without leading 0 / country code)
 * for the +92 input box.
 */
export function toPkNationalDigits(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith("92")) {
    d = d.slice(2);
  }
  if (d.startsWith("0")) {
    d = d.slice(1);
  }
  return d.slice(0, 10);
}

/** Normalize toward local 03… ; empty if no digits. */
export function toPkLocal(phone: string): string {
  const national = toPkNationalDigits(phone);
  if (!national) return "";
  return `0${national}`;
}

export function isValidPkMobile(phone: string): boolean {
  return /^03\d{9}$/.test(toPkLocal(phone)) && toPkNationalDigits(phone).startsWith("3");
}

/** Display mask: XXX-XXXXXXX (dash after first 3 national digits). */
export function formatPkNationalDisplay(phone: string): string {
  const d = toPkNationalDigits(phone);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

export const PK_PHONE_ERROR =
  "Enter a valid Pakistani mobile (e.g. 3001234567).";
