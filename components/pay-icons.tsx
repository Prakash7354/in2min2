// Payment logos for the website's prices (owner, 23 Nov 2026: "payments are
// the area that most needs trust; make them look like real payment pages,
// not fake"). The official full-colour artwork from gilbarbara/logos (CC0,
// public domain), in public/pay/, each on its own white card, as checkout
// pages show them. Only the ways Stripe's checkout takes in the UK: Visa,
// Mastercard, American Express, Apple Pay and Google Pay. Payments open in
// February 2027.

export type PayKey = "visa" | "mastercard" | "amex" | "applepay" | "googlepay";

const PAY: Record<PayKey, { label: string; file: string; w: number; h: number }> = {
  visa: { label: "Visa", file: "visa.svg", w: 256, h: 83 },
  mastercard: { label: "Mastercard", file: "mastercard.svg", w: 256, h: 199 },
  amex: { label: "American Express", file: "amex.svg", w: 256, h: 256 },
  applepay: { label: "Apple Pay", file: "apple-pay.svg", w: 512, h: 211 },
  googlepay: { label: "Google Pay", file: "google-pay.svg", w: 512, h: 204 },
};
export const PAY_ORDER: PayKey[] = ["visa", "mastercard", "amex", "applepay", "googlepay"];

export function PayCard({ pay }: { pay: PayKey }) {
  const p = PAY[pay];
  return (
    <span className="pay-card" data-pay={pay}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed logos */}
      <img src={`/pay/${p.file}`} alt={p.label} width={p.w} height={p.h} loading="lazy" decoding="async" />
    </span>
  );
}

export function StripeLogo({ height = 22 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- the Stripe wordmark
  return <img src="/pay/stripe.svg" alt="Stripe" width={Math.round(height * 512 / 214)} height={height} style={{ display: "inline-block", verticalAlign: "middle" }} />;
}
