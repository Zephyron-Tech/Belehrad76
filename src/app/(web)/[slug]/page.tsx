import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/format";
import { Markdown } from "@/components/Markdown";

type Props = { params: Promise<{ slug: string }> };

/** Samostatné textové stránky z tabulky Page (obchodní podmínky, GDPR, cookies, …). */
async function load(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const page = await getPage(slug);
  return page?.published ? page : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load((await params).slug);
  return page ? { title: page.title } : {};
}

export default async function TextPage({ params }: Props) {
  const page = await load((await params).slug);
  if (!page) notFound();
  const settings = await getSettings();

  return (
    <article className="frame py-14 md:py-24">
      <h1 className="display max-w-[18ch] text-head">{page.title}</h1>
      <p className="mt-4 text-muted">Aktualizováno {formatDate(page.updatedAt)}</p>
      <Markdown source={page.body} settings={settings} className="mt-12" />
    </article>
  );
}
