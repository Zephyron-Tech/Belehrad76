export type DeliveryMethodValue = "SHIPPING" | "PICKUP";

export type ShippingRates = {
  /** Doprava za každý box (Kč) */
  boxCzk: number;
  /** Doprava za každou kusovku (Kč) */
  bottleCzk: number;
};

/**
 * Cena dopravy podle obsahu košíku (potvrzeno zadavatelem):
 *  - každý box 490 Kč, každá kusovka 100 Kč, smíšený košík se sčítá,
 *  - osobní převzetí na FAČR zdarma.
 */
export function calcShipping(
  quantities: { boxes: number; bottles: number },
  method: DeliveryMethodValue,
  rates: ShippingRates,
): number {
  if (method === "PICKUP") return 0;
  return quantities.boxes * rates.boxCzk + quantities.bottles * rates.bottleCzk;
}
