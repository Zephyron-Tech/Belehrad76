import { renderMarkdown } from "@/lib/markdown";
import type { Settings } from "@/lib/settings";

/** Text z tabulky Page / Product (Markdown) s dosazenými hodnotami {{klic}}. */
export function Markdown({ source, settings, className = "" }: { source: string; settings: Settings; className?: string }) {
  return <div className={`prose-edice ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(source, settings) }} />;
}
