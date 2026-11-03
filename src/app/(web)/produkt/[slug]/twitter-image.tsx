// Stejný obrázek jako pro Open Graph (X/Twitter si ho čte zvlášť)
import Image, { alt } from "./opengraph-image";
import { OG_SIZE } from "@/lib/og";

export { alt };
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export default Image;
