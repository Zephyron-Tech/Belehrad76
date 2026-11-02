const czk = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

export function formatCzk(amount: number): string {
  return `${czk.format(amount)} Kč`;
}

const dateTime = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: "Europe/Prague",
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: "Europe/Prague",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export function formatDateTime(d: Date | null | undefined): string {
  return d ? dateTime.format(d) : "";
}

export function formatDate(d: Date | null | undefined): string {
  return d ? dateOnly.format(d) : "";
}

/** PSČ ve tvaru „123 45“ */
export function formatZip(zip: string | null | undefined): string {
  const digits = (zip ?? "").replace(/\s/g, "");
  return /^\d{5}$/.test(digits) ? `${digits.slice(0, 3)} ${digits.slice(3)}` : (zip ?? "");
}

/** Skloňování: 1 box, 2–4 boxy, 5+ boxů */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
