import { marked } from "marked";
import type { Settings } from "./settings";

/**
 * Převede text z databáze (Markdown) na HTML a dosadí hodnoty {{klic}} z nastavení.
 * Texty upravuje jen provozovatel přímo v DB, zákazník do nich nezapisuje.
 */
export function renderMarkdown(source: string, settings: Settings): string {
  return marked.parse(settings.interpolate(source), { async: false, gfm: true, breaks: false });
}
