import Link from "next/link";
import { CartButton } from "./cart/CartButton";
import { MobileMenu } from "./MobileMenu";

export const NAV = [
  { href: "/#soupiska", label: "Edice" },
  { href: "/eshop", label: "E-shop" },
  { href: "/#vecer", label: "Slavnostní večer" },
  { href: "/#nadace", label: "Nadace" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteHeader({ salesOpen }: { salesOpen: boolean }) {
  return (
    <header className="sticky top-0 z-50 bg-ink">
      <div className="frame flex h-[var(--header-h)] items-center justify-between gap-3 sm:gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="display shrink-0 text-[1.125rem] text-gold sm:text-[1.5rem]" aria-label="Mistři Evropy – Bělehrad 1976, úvod">
          Mistři Evropy <span className="hidden text-cream min-[360px]:inline">1976</span>
        </Link>
        <nav aria-label="Hlavní navigace" className="hidden lg:block">
          <ul className="flex gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="nav-link text-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {salesOpen && <CartButton />}
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
