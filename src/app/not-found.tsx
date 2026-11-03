import Link from "next/link";
import { Seal } from "@/components/Seal";

export default function NotFound() {
  return (
    <div className="relative min-h-[80svh] overflow-clip bg-ink">
      <Seal filled decorative id="nf-seal" className="pointer-events-none absolute -bottom-[30vmax] -right-[24vmax] h-[70vmax] w-[70vmax]" />
      <div className="frame relative flex min-h-[80svh] flex-col justify-center py-20">
        <p className="display text-[clamp(7rem,4rem+14vw,16rem)] leading-[0.8] text-gold" aria-hidden="true">
          404
        </p>
        <h1 className="display mt-6 text-head">Stránka nenalezena</h1>
        <p className="mt-4 max-w-[40ch] text-lead">Tahle stránka neexistuje nebo byla přesunuta. Míč skončil mimo hřiště.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn">
            Zpět na úvod
          </Link>
          <Link href="/eshop" className="btn btn-quiet">
            Do e-shopu
          </Link>
        </div>
      </div>
    </div>
  );
}
