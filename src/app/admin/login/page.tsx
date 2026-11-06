import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Přihlášení" };

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line bg-panel p-8">
        <p className="font-serif text-lg font-bold tracking-[0.12em] text-gold">MISTŘI EVROPY</p>
        <h1 className="mt-1 text-sm uppercase tracking-widest text-muted">Administrace objednávek</h1>
        <LoginForm turnstileSiteKey={env.turnstileSiteKey || undefined} />
      </div>
    </div>
  );
}
