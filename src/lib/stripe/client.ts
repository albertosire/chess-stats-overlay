import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export type CheckoutKind = "pro" | "theme" | "bundle";

export function resolvePriceId(kind: CheckoutKind, currency: "usd" | "brl", themeId?: string): string {
  if (kind === "pro") {
    const price =
      currency === "brl"
        ? process.env.STRIPE_PRICE_PRO_BRL
        : process.env.STRIPE_PRICE_PRO_USD;
    if (!price) throw new Error("Stripe Pro price is not configured.");
    return price;
  }

  if (kind === "bundle") {
    const price =
      currency === "brl"
        ? process.env.STRIPE_PRICE_BUNDLE_BRL
        : process.env.STRIPE_PRICE_BUNDLE_USD;
    if (!price) throw new Error("Stripe bundle price is not configured.");
    return price;
  }

  if (!themeId) throw new Error("themeId is required for theme checkout.");
  const envKey = `STRIPE_PRICE_THEME_${themeId.toUpperCase().replace(/-/g, "_")}_${currency.toUpperCase()}`;
  const price = process.env[envKey];
  if (!price) {
    throw new Error(`Stripe theme price missing for ${themeId} (${currency}).`);
  }
  return price;
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
