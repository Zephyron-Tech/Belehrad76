import { ogImage, OG_SIZE } from "@/lib/og";

// Výchozí obrázek ke sdílení pro všechny stránky, které nemají vlastní
export const alt = "Mistři Evropy – Bělehrad 1976: box 13 lahví slivovice s portréty hráčů";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    lines: ["Mistři Evropy", "Bělehrad 1976"],
    sentence: "Sběratelská slivovice: 13 lahví za 13 mistrů z Bělehradu.",
    footer: "152 boxů · 13 hráčů · 1 976 lahví",
    picture: { src: "/img/box-vyrez.png", width: 1079, height: 640, kind: "box" },
  });
}
