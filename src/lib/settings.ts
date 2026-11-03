import { prisma } from "./db";
import { DEFAULT_SETTINGS } from "@/config/default-settings";
import { typo } from "./format";

/** Jak dlouho držet nastavení v paměti. Změna v DB se projeví nejpozději po této době. */
const TTL_MS = 30_000;

const DEFAULTS: Record<string, string> = Object.fromEntries(DEFAULT_SETTINGS.map((s) => [s.key, s.value]));

export class Settings {
  constructor(private readonly values: Record<string, string>) {}

  str(key: string): string {
    return this.values[key] ?? DEFAULTS[key] ?? "";
  }

  /** Text k zobrazení na webu (s českou typografií – nezlomitelné mezery). */
  text(key: string): string {
    return typo(this.str(key));
  }

  num(key: string): number {
    const n = Number(this.str(key).replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(n)) return n;
    const fallback = Number(DEFAULTS[key]);
    return Number.isFinite(fallback) ? fallback : 0;
  }

  bool(key: string): boolean {
    return ["true", "1", "ano", "yes"].includes(this.str(key).toLowerCase());
  }

  /** Dosadí hodnoty do zástupných značek {{klic}} v textu. */
  interpolate(text: string): string {
    return text.replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (_, key: string) => this.str(key));
  }

  all(): Record<string, string> {
    return { ...DEFAULTS, ...this.values };
  }
}

let cache: { at: number; settings: Settings } | null = null;

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.settings;
  const rows = await prisma.setting.findMany();
  const settings = new Settings(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  cache = { at: Date.now(), settings };
  return settings;
}

export function invalidateSettingsCache() {
  cache = null;
}
