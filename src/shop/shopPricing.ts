/**
 * Shop builder pricing and cart lines.
 * - A composition is priced as the sum of its modules (+ one set of feet).
 * - If its module counts match a signature composition exactly, the signature
 *   product (and its price) is used instead — same rule as the quoting workbook.
 * - Prices come from Shopify when available (source of truth for the cart),
 *   otherwise from the catalogue (standalone preview).
 */
import { CATALOG, PRICE_KEYS, type PriceKey, type Signature } from '../cobra/config';
import { countsFromBuilder, findSignature, totalWeight, type Counts } from '../cobra/pricing';
import { MODULE_HANDLES, SIGNATURE_HANDLES, VINYL_CAPACITY } from './config';

export type ShopProduct = { variantId: number; price: number; available: boolean };

export type ShopCatalog = {
  country: string | null;
  currency: string;
  deliverable: boolean;
  /** Keyed by Shopify product handle. */
  products: Record<string, ShopProduct>;
};

export type ShopLine = {
  key: PriceKey | 'signature';
  handle: string;
  label: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: ShopProduct | null;
};

export type ShopQuote = {
  counts: Counts;
  signature: Signature | null;
  lines: ShopLine[];
  total: number;
  /** Every line has a purchasable Shopify product. */
  purchasable: boolean;
  weightKg: number;
  /** Estimated record capacity, null when the composition has none. */
  capacity: { lp: number; singles: number } | null;
};

export type PlacedLike = { typeId: string; w: number; col: number; row: number };

export function quoteComposition(items: PlacedLike[], addFeet: boolean, catalog: ShopCatalog | null): ShopQuote {
  const counts = countsFromBuilder(items, addFeet);
  const signature = items.length > 0 ? findSignature(counts) : null;
  let lines: ShopLine[];

  if (signature) {
    const handle = SIGNATURE_HANDLES[signature.id];
    const product = catalog?.products[handle] ?? null;
    const unitPrice = product?.price ?? signature.prices.valchromat;
    lines = [{ key: 'signature', handle, label: signature.name, quantity: 1, unitPrice, subtotal: unitPrice, product }];
  } else {
    lines = PRICE_KEYS.filter((key) => counts[key] > 0).map((key) => {
      const handle = MODULE_HANDLES[key];
      const product = catalog?.products[handle] ?? null;
      const unitPrice = product?.price ?? CATALOG[key].prices.valchromat;
      return {
        key,
        handle,
        label: key === 'feet' ? 'Feet' : CATALOG[key].label,
        quantity: counts[key],
        unitPrice,
        subtotal: unitPrice * counts[key],
        product,
      };
    });
  }

  const lp = PRICE_KEYS.reduce((sum, key) => sum + counts[key] * (VINYL_CAPACITY[key]?.lp ?? 0), 0);
  const singles = PRICE_KEYS.reduce((sum, key) => sum + counts[key] * (VINYL_CAPACITY[key]?.singles ?? 0), 0);
  const capacity = lp > 0 || singles > 0 ? { lp, singles } : null;

  return {
    counts,
    signature,
    lines,
    total: lines.reduce((sum, line) => sum + line.subtotal, 0),
    purchasable: lines.length > 0 && lines.every((line) => line.product !== null && line.product.available),
    weightKg: totalWeight(counts),
    capacity,
  };
}

/** Number of stacked levels (Nest, a 3 cm platform, does not count as a level). */
export function levels(items: PlacedLike[]): number {
  const rows = items.filter((item) => item.typeId !== 'nest').map((item) => item.row);
  return rows.length === 0 ? 0 : Math.max(...rows) + 1;
}

export function positionLabel(item: PlacedLike): string {
  const col = item.col + 1;
  return `R${item.row + 1} C${item.w === 2 ? `${col}-${col + 1}` : col}`;
}

export function layoutLabel(items: PlacedLike[], addFeet: boolean): string {
  const modules = [...items]
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((item) => `${item.typeId.toUpperCase()} ${positionLabel(item)}`);
  return `${modules.join(' | ')}${addFeet ? ' | FEET' : ''}`;
}

export function makeCompositionId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `GA-${stamp}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export type CartItem = { id: number; quantity: number; properties: Record<string, string> };

/**
 * Cart lines for Shopify's /cart/add.js. Properties starting with "_" are kept
 * on the order (visible in the Shopify admin) but hidden from the customer.
 */
export function buildCartItems(
  quote: ShopQuote,
  items: PlacedLike[],
  addFeet: boolean,
  meta: { compositionId: string; previewUrl?: string },
): CartItem[] {
  const shared: Record<string, string> = { '_Composition ID': meta.compositionId };
  if (meta.previewUrl) shared._Preview = meta.previewUrl;
  const layout = layoutLabel(items, addFeet);

  return quote.lines.map((line) => {
    if (!line.product) throw new Error(`No Shopify product for ${line.handle}`);
    const properties: Record<string, string> = { ...shared };
    if (line.key === 'signature') {
      properties._Layout = layout;
    } else if (line.key === 'feet') {
      properties._Positions = 'Under the bottom row';
    } else {
      properties._Positions = items
        .filter((item) => item.typeId === line.key)
        .sort((a, b) => a.row - b.row || a.col - b.col)
        .map(positionLabel)
        .join('; ');
      properties._Layout = layout;
    }
    return { id: line.product.variantId, quantity: line.quantity, properties };
  });
}

export function formatMoney(value: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
