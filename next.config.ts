import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // HTTPS zajišťuje Traefik; HSTS se pošle i z aplikace (prohlížeč ji na http ignoruje)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Písma pro PDF potvrzení se čtou z disku – na Vercelu je nutné je přibalit k serverovým funkcím
  outputFileTracingIncludes: {
    "/**/*": ["./assets/fonts/**/*"],
    // obrázky ke sdílení (opengraph-image) čtou výřezy a pečeť z disku
    "/**/opengraph-image*": ["./public/og/**/*", "./public/img/box-vyrez.png", "./public/img/hraci/**/*"],
    "/**/twitter-image*": ["./public/og/**/*", "./public/img/box-vyrez.png", "./public/img/hraci/**/*"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Obrázky: prohlížeč je drží 1 den a další týden je smí použít, zatímco si na pozadí ověří novou verzi.
      // (Krátká doba, protože finální fotky se budou nahrávat pod stejnými názvy.)
      {
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
