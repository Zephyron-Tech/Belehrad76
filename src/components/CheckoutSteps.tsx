const STEPS = ["Košík", "Údaje a doprava", "Platba"] as const;

/** Kde v nákupu zákazník je. Pořadí nese seznam, ne čísla. */
export function CheckoutSteps({ current }: { current: (typeof STEPS)[number] }) {
  return (
    <nav aria-label="Postup objednávky">
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={s === current ? "step" : undefined} className="flex items-center gap-5">
            {s}
            {i < STEPS.length - 1 && <span aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
