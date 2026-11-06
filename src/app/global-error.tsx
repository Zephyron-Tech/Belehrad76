"use client";

/** Poslední záchrana: chyba v kořenovém layoutu (nemá k dispozici styly ani layout webu). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, background: "#0f0d0b", color: "#efe8dc", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: "2rem", margin: 0 }}>Něco se pokazilo</h1>
            <p style={{ margin: "1rem 0 2rem", color: "#b0a48c" }}>Stránku se nepodařilo načíst. Zkuste to prosím znovu.</p>
            <button
              type="button"
              onClick={reset}
              style={{ cursor: "pointer", background: "#c9a35c", color: "#0f0d0b", border: 0, padding: "0.85rem 1.5rem", fontWeight: 700, fontSize: "1rem" }}
            >
              Zkusit znovu
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
