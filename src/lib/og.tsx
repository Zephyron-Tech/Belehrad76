import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Obrázky ke sdílení odkazu (Facebook, WhatsApp, X…): 1200 × 630, ve stylu úvodu webu. */
export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0f0d0b";
const GOLD = "#c9a35c";
const CREAM = "#efe8dc";
const MUTED = "#b0a48c";

async function file(path: string) {
  return readFile(join(process.cwd(), path));
}

async function dataUrl(publicPath: string) {
  const ext = publicPath.split(".").pop() === "png" ? "png" : "jpeg";
  return `data:image/${ext};base64,${(await file(join("public", publicPath))).toString("base64")}`;
}

async function fonts() {
  const [display, text] = await Promise.all([
    file("assets/fonts/Archivo-Compressed-ExtraBold.woff"),
    file("assets/fonts/Archivo-SemiBold.woff"),
  ]);
  return [
    { name: "Archivo Compressed", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Archivo", data: text, weight: 600 as const, style: "normal" as const },
  ];
}

type Props = {
  /** Dva řádky velkého nadpisu (první zlatě, druhý krémově) */
  lines: [string, string];
  /** Věta pod nadpisem */
  sentence: string;
  /** Řádek dole (fakta, cena) */
  footer: string;
  /** Obrázek na kotouči pečeti: výřez boxu, nebo etiketa lahve */
  picture: { src: string; width: number; height: number; kind: "box" | "label" };
};

export async function ogImage({ lines, sentence, footer, picture }: Props) {
  const [seal, pic, fontList] = await Promise.all([dataUrl("/og/pecet.png"), dataUrl(picture.src), fonts()]);
  const isBox = picture.kind === "box";
  const picW = isBox ? 500 : 250;
  const picH = Math.round((picW * picture.height) / picture.width);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: INK, position: "relative", overflow: "hidden" }}>
        {/* obří pečeť oříznutá vpravo, jako v úvodu webu */}
        {/* eslint-disable-next-line @next/next/no-img-element -- satori vykresluje jen <img> */}
        <img src={seal} alt="" width={860} height={860} style={{ position: "absolute", left: 600, top: -115 }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- satori vykresluje jen <img> */}
        <img
          src={pic}
          alt=""
          width={picW}
          height={picH}
          style={{
            position: "absolute",
            left: isBox ? 664 : 905,
            top: Math.round((630 - picH) / 2) + (isBox ? 20 : 0),
            transform: isBox ? "rotate(0deg)" : "rotate(-2.5deg)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 64px", width: isBox ? 640 : 800 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Archivo Compressed", fontSize: isBox ? 96 : 104, lineHeight: 0.96, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            <span style={{ color: GOLD }}>{lines[0]}</span>
            <span style={{ color: CREAM }}>{lines[1]}</span>
          </div>
          <div style={{ display: "flex", marginTop: 28, fontFamily: "Archivo", fontSize: 30, lineHeight: 1.3, color: CREAM, maxWidth: 520 }}>{sentence}</div>
          <div style={{ display: "flex", marginTop: 36, fontFamily: "Archivo", fontSize: 24, color: MUTED }}>{footer}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fontList },
  );
}
