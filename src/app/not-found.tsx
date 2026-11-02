import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-6xl font-bold text-gold">404</p>
      <h1 className="mt-4 font-serif text-2xl text-cream">Stránka nenalezena</h1>
      <Link href="/" className="mt-6 text-gold-light underline underline-offset-4">
        Zpět na úvod
      </Link>
    </div>
  );
}
