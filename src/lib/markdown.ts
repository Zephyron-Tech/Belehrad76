import { marked } from "marked";
import type { Settings } from "./settings";
import { typo } from "./format";

/**
 * Převede text z databáze (Markdown) na HTML, dosadí hodnoty {{klic}} z nastavení
 * a doplní českou typografii (nezlomitelné mezery).
 * Texty upravuje jen provozovatel přímo v DB, zákazník do nich nezapisuje.
 */
export function renderMarkdown(source: string, settings: Settings): string {
  return marked.parse(typo(settings.interpolate(source)), { async: false, gfm: true, breaks: false });
}
