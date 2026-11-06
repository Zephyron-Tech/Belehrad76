"use client";

import { useEffect, useRef, useState } from "react";

type Shot = [file: string, width: number, height: number];
type Page = { nav: string; label: string; title: string; path: string; d: Shot; m: Shot };

// d = snímek pro počítač, m = pro telefon; Menu ukazuje na telefonu otevřené menu, na počítači úvod
const PAGES: Record<string, Page> = {
  uvod: { nav: "Úvod", label: "Úvodní stránka", title: "Mistři Evropy – Bělehrad 1976", path: "", d: ["uvod-desktop", 2160, 9218], m: ["uvod-mobile", 780, 13498] },
  menu: { nav: "Menu", label: "Otevřené menu", title: "Mistři Evropy – Bělehrad 1976", path: "", d: ["uvod-desktop", 2160, 9218], m: ["menu-mobile", 780, 1688] },
  eshop: { nav: "E-shop", label: "E-shop", title: "E-shop · Mistři Evropy 1976", path: "/eshop", d: ["eshop-desktop", 2160, 5304], m: ["eshop-mobile", 780, 8406] },
  produkt: { nav: "Lahev hráče", label: "Detail lahve hráče", title: "Slivovice Antonín Panenka · Mistři Evropy 1976", path: "/produkt/antonin-panenka", d: ["produkt-desktop", 2160, 3186], m: ["produkt-mobile", 780, 5492] },
  kosik: { nav: "Košík", label: "Košík", title: "Košík · Mistři Evropy 1976", path: "/kosik", d: ["kosik-desktop", 2160, 2361], m: ["kosik-mobile", 780, 4896] },
  pokladna: { nav: "Pokladna", label: "Pokladna", title: "Objednávka · Mistři Evropy 1976", path: "/pokladna", d: ["pokladna-desktop", 2160, 4502], m: ["pokladna-mobile", 780, 8644] },
};
const src = (file: string) => `/preview/${file}.jpg`;

// Hlavní e-maily zákazníkovi v pořadí, jak přicházejí
const EMAILS = [
  { file: "prijata", subject: "Objednávka 2600042 přijata", label: "Objednávka přijata" },
  { file: "zaplaceno", subject: "Platba za objednávku 2600042 přijata", label: "Platba přijata" },
  { file: "odeslano", subject: "Objednávka 2600042 byla odeslána", label: "Odesláno" },
];
const EMAIL_KEY = "emaily";

export function PreviewClient() {
  const [key, setKey] = useState("uvod");
  const macRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // stránka se volí kotvou (#eshop …), ať jde poslat odkaz rovnou na ni
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      setKey(PAGES[h] || h === EMAIL_KEY ? h : "uvod");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    if (macRef.current) macRef.current.scrollTop = 0;
    if (phoneRef.current) phoneRef.current.scrollTop = 0;
  }, [key]);

  // ostatní snímky načíst dopředu, ať přepnutí neproblikne
  useEffect(() => {
    Object.values(PAGES).forEach((p) =>
      [p.d[0], p.m[0]].forEach((f) => {
        const i = new Image();
        i.src = src(f);
      }),
    );
  }, []);

  const isEmail = key === EMAIL_KEY;
  const p = PAGES[key] ?? PAGES.uvod;
  return (
    <div className="pv">
      <div className="pv-wrap">
        <header className="pv-header">
          <div className="pv-brand">
            <div className="pv-seal" aria-hidden="true">
              1976
            </div>
            <h1 className="pv-title">
              Mistři Evropy <span>Bělehrad 1976</span>
            </h1>
          </div>
          <nav className="pv-nav" aria-label="Stránky webu">
            {Object.entries(PAGES).map(([k, page]) => (
              <a key={k} href={`#${k}`} aria-current={k === key ? "page" : undefined}>
                {page.nav}
              </a>
            ))}
            <a href={`#${EMAIL_KEY}`} aria-current={isEmail ? "page" : undefined}>
              E-maily
            </a>
          </nav>
        </header>

        {isEmail ? (
          <main className="pv-stage pv-stage-mails">
            {EMAILS.map((m) => (
              <figure key={m.file} className="pv-mail">
                <Phone>
                  <div className="pv-mailhead" aria-hidden="true">
                    <span className="pv-mailseal">76</span>
                    <span className="pv-mailmeta">
                      <b>Mistři Evropy 1976</b>
                      <span>{m.subject}</span>
                    </span>
                  </div>
                  <div className="pv-scroll" tabIndex={0} aria-label={`E-mail ${m.label}, obsah lze posouvat`}>
                    <iframe
                      src={`/preview/emaily/${m.file}.html`}
                      title={`E-mail: ${m.label}`}
                      className="pv-mailframe"
                      onLoad={(e) => {
                        const f = e.currentTarget;
                        const h = f.contentDocument?.documentElement.scrollHeight;
                        if (h) f.style.height = `${h}px`;
                      }}
                    />
                  </div>
                </Phone>
                <figcaption className="pv-caption">{m.label}</figcaption>
              </figure>
            ))}
          </main>
        ) : (
        <main className="pv-stage">
          <div className="pv-mac" aria-label="Počítač s prohlížečem Chrome">
            <div className="pv-mac-lid">
              <div className="pv-mac-screen">
                <div className="pv-chrome" aria-hidden="true">
                  <div className="pv-tabs">
                    <div className="pv-lights">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="pv-tab">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/preview/favicon-64.png" alt="" />
                      <span>{p.title}</span>
                      <b>×</b>
                    </div>
                    <div className="pv-newtab">+</div>
                  </div>
                  <div className="pv-toolbar">
                    <svg viewBox="0 0 24 24">
                      <path d="M19 12H5M11 6l-6 6 6 6" />
                    </svg>
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    <svg viewBox="0 0 24 24">
                      <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
                    </svg>
                    <div className="pv-omnibox">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
                        <circle cx="16" cy="7" r="2" />
                        <circle cx="10" cy="17" r="2" />
                      </svg>
                      <span>
                        <span className="pv-host">belehrad76.cz</span>
                        <span className="pv-path">{p.path}</span>
                      </span>
                    </div>
                    <div className="pv-avatar" />
                  </div>
                </div>
                <div className="pv-scroll" ref={macRef} tabIndex={0} aria-label="Web na počítači, obsah lze posouvat">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(p.d[0])} width={p.d[1]} height={p.d[2]} alt={`${p.label} na počítači`} />
                </div>
              </div>
            </div>
            <div className="pv-mac-base" />
          </div>

          <Phone>
            <div className="pv-scroll" ref={phoneRef} tabIndex={0} aria-label="Web na telefonu, obsah lze posouvat">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p.m[0])} width={p.m[1]} height={p.m[2]} alt={`${p.label} na telefonu`} />
            </div>
          </Phone>
        </main>
        )}

        <p className="pv-hint">Obrazovky lze posouvat</p>
      </div>
    </div>
  );
}

/** iPhone: tělo, Dynamic Island a stavový řádek iOS; obsah obrazovky dodá volající */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="pv-phone" aria-label="Telefon">
      <div className="pv-phone-body">
        <div className="pv-phone-screen">
          <div className="pv-island" aria-hidden="true" />
          <div className="pv-status" aria-hidden="true">
            <span>9:41</span>
            <span className="pv-icons">
              <svg viewBox="0 0 18 12">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10" y="3" width="3" height="9" rx="1" />
                <rect x="15" y="0" width="3" height="12" rx="1" />
              </svg>
              <svg viewBox="0 0 16 12">
                <path d="M8 2.3c2.4 0 4.6.9 6.3 2.5l1.3-1.4A10.8 10.8 0 0 0 8 .3 10.8 10.8 0 0 0 .4 3.4l1.3 1.4A8.8 8.8 0 0 1 8 2.3Zm0 3.6c1.4 0 2.7.5 3.7 1.4L13 6a7.5 7.5 0 0 0-10 0l1.3 1.3c1-.9 2.3-1.4 3.7-1.4Zm0 3.6c-.6 0-1.1.2-1.5.6L8 11.7l1.5-1.6c-.4-.4-.9-.6-1.5-.6Z" />
              </svg>
              <svg viewBox="0 0 27 12">
                <rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="#fff" strokeOpacity=".45" />
                <rect x="2" y="2" width="16" height="8" rx="2" />
                <path d="M24.2 4v4c.9-.3 1.5-1.1 1.5-2s-.6-1.7-1.5-2Z" fillOpacity=".45" />
              </svg>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
