"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Plynulý návrat nahoru: rychlý rozjezd i dojezd, délka podle vzdálenosti (0,5–1,1 s). */
function scrollToTop() {
  const start = window.scrollY;
  if (start <= 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  const duration = Math.min(1100, Math.max(500, start * 0.25));
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const t0 = performance.now();
  let frame = 0;
  // Kolečko, dotyk nebo klávesa animaci přeruší – stránka nesmí uživateli „utíkat“ pod rukou
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const e of ["wheel", "touchstart", "keydown"]) window.removeEventListener(e, stop);
  };
  for (const e of ["wheel", "touchstart", "keydown"]) window.addEventListener(e, stop, { passive: true });
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    // „instant“: html má scroll-behavior: smooth, který by jinak animoval každý krok zvlášť
    window.scrollTo({ top: Math.round(start * (1 - ease(t))), behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
}

/** Logo v hlavičce: na úvodu plynule vyjede nahoru, jinde normálně přejde na úvod. */
export function LogoLink({ className, children, label }: { className: string; children: React.ReactNode; label: string }) {
  const pathname = usePathname();
  return (
    <Link
      href="/"
      className={className}
      aria-label={label}
      onClick={(e) => {
        if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        history.replaceState(null, "", "/");
        scrollToTop();
      }}
    >
      {children}
    </Link>
  );
}
