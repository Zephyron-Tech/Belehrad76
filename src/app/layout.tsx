import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Jedna rodina: zúžený řez na nadpisy (jako jména na etiketách lahví), normální šířka na text
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "Mistři Evropy – Bělehrad 1976", template: "%s · Mistři Evropy 1976" },
};

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Proměnná písma musí být na <html>: z něj ji čte --font-sans v :root
    <html lang="cs" className={archivo.variable} suppressHydrationWarning>
      <head>
        {/* Skryté výchozí stavy animací platí jen se skriptem – bez JS je obsah vidět hned */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
