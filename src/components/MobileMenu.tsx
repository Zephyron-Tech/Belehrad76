"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Menu pro telefon: panel pod hlavičkou, velké odkazy. Zavře se po kliknutí, Esc nebo změně stránky. */
export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        className="menu-toggle btn btn-quiet min-h-11 px-3 text-[1rem] sm:px-4"
        aria-expanded={open}
        aria-controls="mobilni-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-icon" aria-hidden="true">
          <span />
          <span />
        </span>
        {open ? "Zavřít" : "Menu"}
      </button>
      <div ref={panel} id="mobilni-menu" className="mobile-menu" data-open={open} inert={!open}>
        <ul className="frame pb-8 pt-4">
          {items.map((item, i) => (
            <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
              <Link href={item.href} className="display block py-2 text-[2.75rem] text-cream" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
