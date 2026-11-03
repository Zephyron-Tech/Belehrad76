/**
 * Chyby, jejichž zpráva je určená zákazníkovi nebo obsluze administrace (česky, bez technických detailů).
 * API a akce zobrazí `message` jen u potomků AppError; ostatní chyby (databáze, síť, GoPay API)
 * se zalogují a uživatel dostane obecnou hlášku – technické detaily tak nikdy neuniknou ven.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    // Název podle skutečné třídy potomka (CheckoutError, TransitionError, …)
    this.name = new.target.name;
  }
}

/** Neplatná objednávka z pokladny; volitelně s chybami jednotlivých polí formuláře. */
export class CheckoutError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Nepovolená změna stavu objednávky. */
export class TransitionError extends AppError {}

/** Nedostatek kusů na skladě (zpráva je česky, ale obvykle ji volající převede na CheckoutError / TransitionError). */
export class OutOfStockError extends AppError {
  constructor(public readonly productName: string) {
    super(`${productName}: nedostatek kusů skladem.`);
  }
}

/** Platbu nelze spustit (objednávka už nečeká na platbu, vypršela, …). */
export class PaymentError extends AppError {}

/** Zpráva pro uživatele: u AppError její text, jinak obecná hláška. */
export function userMessage(err: unknown, fallback: string): string {
  return err instanceof AppError ? err.message : fallback;
}
