import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mistři Evropy – Bělehrad 1976",
    short_name: "Mistři Evropy",
    description: "Limitovaná edice slivovice k 50. výročí vítězství na ME 1976 v Bělehradě.",
    start_url: "/",
    display: "browser",
    background_color: "#0f0d0b",
    theme_color: "#0f0d0b",
    lang: "cs",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
