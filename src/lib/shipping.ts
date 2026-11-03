export type DeliveryMethodValue = "SHIPPING" | "PICKUP";

export type ShippingRates = {
  /** Doprava za objednávku s boxem – jednou, bez ohledu na počet boxů a kusovek (Kč) */
  boxCzk: number;
  /** Doprava za každou kusovku (Kč) */
  bottleCzk: number;
};

/**
 * Cena dopravy podle obsahu košíku (potvrzeno zadavatelem):
 *  - košík s boxem: jednou 490 Kč, i při více boxech a přidaných kusovkách,
 *  - jen kusovky: 100 Kč za kus,
 *  - osobní převzetí na FAČR zdarma.
 */
export function calcShipping(
  quantities: { boxes: number; bottles: number },
  method: DeliveryMethodValue,
  rates: ShippingRates,
): number {
  if (method === "PICKUP") return 0;
  if (quantities.boxes > 0) return rates.boxCzk;
  return quantities.bottles * rates.bottleCzk;
}
