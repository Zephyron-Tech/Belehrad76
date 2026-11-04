const STEPS = ["Košík", "Údaje a doprava", "Platba"] as const;

/** Kde v nákupu zákazník je. Pořadí nese seznam, ne čísla. */
export function CheckoutSteps({ current }: { current: (typeof STEPS)[number] }) {
  return (
    <nav aria-label="Postup objednávky">
      <ol className="steps">
        {STEPS.map((s) => (
          <li key={s} aria-current={s === current ? "step" : undefined}>
            {s}
          </li>
        ))}
      </ol>
    </nav>
  );
}
