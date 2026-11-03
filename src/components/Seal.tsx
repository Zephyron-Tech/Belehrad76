/**
 * Červená pečeť „1976“ jako na boxu a etiketách.
 * `filled`: plný červený kotouč s tmavě červeným písmem (velký tvar v úvodu a v soupisce).
 * Bez `size` se velikost řídí třídou (width/height v CSS).
 */
export function Seal({
  size,
  className = "",
  filled = false,
  decorative = false,
  id = "seal",
}: {
  size?: number;
  className?: string;
  filled?: boolean;
  decorative?: boolean;
  /** Unikátní na stránce – kvůli kruhové cestě textu */
  id?: string;
}) {
  const pathId = `${id}-path`;
  const ink = filled ? "var(--seal-deep)" : "var(--seal)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Pečeť 1976 – Mistři Evropy, Bělehrad" })}
    >
      <defs>
        <path id={pathId} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      {filled && <circle cx="100" cy="100" r="99" fill="var(--seal)" />}
      <circle cx="100" cy="100" r="94" fill="none" stroke={ink} strokeWidth="3" />
      <circle cx="100" cy="100" r="88" fill="none" stroke={ink} strokeWidth="1.5" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="58" fill="none" stroke={ink} strokeWidth="2.5" />
      {/* text vyplní přesně celý obvod kruhu (2π · 74), aby se konec nepřekrýval se začátkem */}
      <text fill={ink} fontSize="15" fontWeight="700" fontFamily="var(--font-archivo)">
        <textPath href={`#${pathId}`} startOffset="0" textLength="460" lengthAdjust="spacing">
          MISTŘI EVROPY · BĚLEHRAD · 1976 · 50 LET ·
        </textPath>
      </text>
      <text
        x="100"
        y="116"
        textAnchor="middle"
        fill={ink}
        fontSize="44"
        fontWeight="800"
        fontFamily="var(--font-archivo)"
        style={{ fontStretch: "75%" }}
      >
        1976
      </text>
    </svg>
  );
}
