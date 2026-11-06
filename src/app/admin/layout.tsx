import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administrace", template: "%s · Administrace" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-ink text-cream">{children}</div>;
}
