import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif font-bold tracking-[0.12em] text-gold">
              MISTŘI EVROPY · admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-cream hover:text-gold-light">
                Objednávky
              </Link>
              <Link href="/admin/exporty" className="text-cream hover:text-gold-light">
                Exporty
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{session.email}</span>
            <form action={logoutAction}>
              <button className="border border-line px-3 py-1.5 text-cream hover:border-gold">Odhlásit</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <p className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted">
        Obsahuje osobní údaje zákazníků (GDPR). Po 30 minutách nečinnosti budete odhlášeni. Ceny, sklad, doprava a texty se
        upravují v databázi (tabulky Product, Setting, Page).
      </p>
    </>
  );
}
