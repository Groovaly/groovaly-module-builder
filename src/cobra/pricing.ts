/**
 * Cobra pricing — same rules as Romain's quoting workbook:
 * 1. Count the modules (+ 1 "feet" if the composition is on feet).
 * 2. If the counts match one of the 12 signatures exactly, use its bundle price;
 *    otherwise sum the modules sold alone, in the chosen finish.
 * 3. Delivery = rate for the country's zone and the total weight bracket.
 */
import {
  CATALOG,
  COUNTRY_ZONES,
  DELIVERY_INCLUDED,
  DELIVERY_RATES,
  PRICE_KEYS,
  SIGNATURES,
  WEIGHT_BRACKETS,
  type Finish,
  type PriceKey,
  type Signature,
} from './config';

export type Counts = Record<PriceKey, number>;

export type PriceLine = {
  label: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type DeliveryQuote = {
  zone: string | null;
  bracket: string;
  /** null when the country is outside the covered zones (quote by hand). */
  cost: number | null;
  included: boolean;
};

export type PriceBreakdown = {
  lines: PriceLine[];
  /** Signature whose bundle price applies, if the counts match one exactly. */
  signature: Signature | null;
  compositionTotal: number;
  weightKg: number;
  delivery: DeliveryQuote;
  /** Composition + delivery (delivery counted as 0 when included or not covered). */
  total: number;
};

export type PricedItem = { typeId: string };

export function emptyCounts(): Counts {
  return { bloom: 0, tilt: 0, chest: 0, nest: 0, cub: 0, split: 0, grid: 0, lean: 0, feet: 0 };
}

/** Counts from the builder: one per placed module, plus one set of feet if the switch is on. */
export function countsFromBuilder(items: PricedItem[], addFeet: boolean): Counts {
  const counts = emptyCounts();
  for (const item of items) {
    const key = item.typeId as PriceKey;
    if (key in counts && key !== 'feet') counts[key] += 1;
  }
  counts.feet = addFeet && items.length > 0 ? 1 : 0;
  return counts;
}

export function countsFromSignature(signature: Signature): Counts {
  const counts = emptyCounts();
  for (const key of PRICE_KEYS) counts[key] = signature.modules[key] ?? 0;
  return counts;
}

export function signatureKey(counts: Counts): string {
  return PRICE_KEYS.map((key) => `${key}${counts[key]}`).join('-');
}

export function findSignature(counts: Counts): Signature | null {
  const key = signatureKey(counts);
  return SIGNATURES.find((signature) => signatureKey(countsFromSignature(signature)) === key) ?? null;
}

export function totalWeight(counts: Counts): number {
  const weight = PRICE_KEYS.reduce((sum, key) => sum + counts[key] * CATALOG[key].weightKg, 0);
  return Math.round(weight * 10) / 10;
}

export function quoteDelivery(weightKg: number, country: string): DeliveryQuote {
  let index = 0;
  WEIGHT_BRACKETS.forEach((bracket, i) => {
    if (weightKg >= bracket.minKg) index = i;
  });
  const bracket = WEIGHT_BRACKETS[index].label;
  const zone = COUNTRY_ZONES.find((entry) => entry.country === country)?.zone ?? null;
  const cost = zone ? DELIVERY_RATES[zone]?.[index] ?? null : null;
  return { zone, bracket, cost, included: DELIVERY_INCLUDED };
}

export function priceCounts(counts: Counts, finish: Finish, country: string): PriceBreakdown {
  const signature = findSignature(counts);
  let lines: PriceLine[];

  if (signature) {
    const price = signature.prices[finish.tier];
    lines = [{ label: `${signature.name} (composition signature)`, quantity: 1, unitPrice: price, subtotal: price }];
  } else {
    lines = PRICE_KEYS.filter((key) => counts[key] > 0).map((key) => {
      const unitPrice = CATALOG[key].prices[finish.tier];
      return { label: CATALOG[key].label, quantity: counts[key], unitPrice, subtotal: unitPrice * counts[key] };
    });
  }

  const compositionTotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const weightKg = totalWeight(counts);
  const delivery = quoteDelivery(weightKg, country);
  const deliveryCharged = delivery.included ? 0 : delivery.cost ?? 0;

  return {
    lines,
    signature,
    compositionTotal,
    weightKg,
    delivery,
    total: compositionTotal + deliveryCharged,
  };
}

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export function formatEuro(value: number): string {
  return euroFormatter.format(value).replace(/ /g, ' ');
}

export function formatKg(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} kg`;
}

export function deliveryLabel(delivery: DeliveryQuote): string {
  if (delivery.included) return 'Incluse';
  if (delivery.cost === null) return 'Sur devis (pays hors zone)';
  return formatEuro(delivery.cost);
}

export function priceLinesText(breakdown: PriceBreakdown, finish: Finish): string {
  const lines = breakdown.lines.map(
    (line) => `${line.quantity} × ${line.label} — ${formatEuro(line.unitPrice)} = ${formatEuro(line.subtotal)}`,
  );
  lines.push(`Composition (${finish.label}) : ${formatEuro(breakdown.compositionTotal)}`);
  lines.push(
    `Livraison (${breakdown.delivery.zone ?? 'hors zone'}, ${breakdown.delivery.bracket}, ${formatKg(breakdown.weightKg)}) : ${deliveryLabel(breakdown.delivery)}`,
  );
  lines.push(`TOTAL TTC : ${formatEuro(breakdown.total)}${breakdown.delivery.cost === null && !breakdown.delivery.included ? ' + livraison sur devis' : ''}`);
  return lines.join('\n');
}
