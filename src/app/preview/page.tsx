import type { Metadata } from "next";
import { PreviewClient } from "./PreviewClient";
import "./preview.css";

// Prezentace návrhu pro klienta: snímky webu v MacBooku (Chrome) a iPhonu. Mimo (web), takže bez hlavičky, patičky a věkové brány.
export const metadata: Metadata = {
  title: { absolute: "Mistři Evropy 1976 · návrh webu" },
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return <PreviewClient />;
}
