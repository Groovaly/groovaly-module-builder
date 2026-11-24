import { SIGNATURES } from '../cobra/config';
import { countsFromSignature } from '../cobra/pricing';
import { MODULE_HANDLES, SIGNATURE_HANDLES } from './config';
import { buildCartItems, levels, quoteComposition, type ShopCatalog } from './shopPricing';

const place = (typeId: string, col: number, row: number, w = 1) => ({ typeId, col, row, w });

function catalogWith(prices: Record<string, number>, available = true): ShopCatalog {
  const products: ShopCatalog['products'] = {};
  Object.entries(prices).forEach(([handle, price], index) => {
    products[handle] = { variantId: 1000 + index, price, available };
  });
  return { country: 'FR', currency: 'EUR', deliverable: true, products };
}

describe('shop builder pricing', () => {
  it('sums module prices and one set of feet (workbook prices as fallback)', () => {
    const quote = quoteComposition([place('tilt', 0, 0, 2), place('cub', 2, 0), place('bloom', 0, 1)], true, null);
    expect(quote.signature).toBeNull();
    expect(quote.total).toBe(1190 + 790 + 1050 + 90);
    expect(quote.purchasable).toBe(false);
  });

  it('uses the signature price when the counts match a signature exactly', () => {
    const quote = quoteComposition([place('tilt', 0, 0, 2)], true, null);
    expect(quote.signature?.name).toBe('Alton');
    expect(quote.total).toBe(1250);
    for (const signature of SIGNATURES) {
      const counts = countsFromSignature(signature);
      const items = Object.entries(counts).flatMap(([key, n]) =>
        key === 'feet' ? [] : Array.from({ length: n }, (_, i) => place(key, i, 0)),
      );
      expect(quoteComposition(items, counts.feet > 0, null).total).toBe(signature.prices.valchromat);
    }
  });

  it('prefers Shopify prices and needs every product to be available to sell', () => {
    const catalog = catalogWith({ [MODULE_HANDLES.tilt]: 1290, [MODULE_HANDLES.cub]: 790 });
    const quote = quoteComposition([place('tilt', 0, 0, 2), place('cub', 2, 0)], false, catalog);
    expect(quote.total).toBe(2080);
    expect(quote.purchasable).toBe(true);
    const signatureCatalog = catalogWith({ [SIGNATURE_HANDLES.alton]: 1299 }, false);
    const alton = quoteComposition([place('tilt', 0, 0, 2)], true, signatureCatalog);
    expect(alton.total).toBe(1299);
    expect(alton.purchasable).toBe(false);
  });

  it('builds cart lines with hidden composition properties', () => {
    const catalog = catalogWith({ grid: 950, split: 850, 'golden-age-feet': 90 });
    const items = [place('grid', 1, 0), place('grid', 2, 0), place('split', 1, 1)];
    const quote = quoteComposition(items, true, catalog);
    const lines = buildCartItems(quote, items, true, { compositionId: 'GA-1', previewUrl: 'https://x/y.jpg' });
    expect(lines).toHaveLength(3);
    const grid = lines.find((line) => line.id === catalog.products.grid.variantId)!;
    expect(grid.quantity).toBe(2);
    expect(grid.properties).toMatchObject({ '_Composition ID': 'GA-1', _Positions: 'R1 C2; R1 C3', _Preview: 'https://x/y.jpg' });
    expect(lines.find((line) => line.id === catalog.products['golden-age-feet'].variantId)?.quantity).toBe(1);
  });

  it('adds up the record capacity in LPs and 7-inch singles', () => {
    const quote = quoteComposition([place('tilt', 0, 0, 2), place('chest', 2, 0, 2), place('bloom', 0, 1), place('grid', 1, 1)], false, null);
    expect(quote.capacity).toEqual({ lp: 230, singles: 300 });
    expect(quoteComposition([place('grid', 0, 0)], false, null).capacity).toBeNull();
  });

  it('counts levels without the Nest platform', () => {
    expect(levels([place('tilt', 0, 0, 2), place('nest', 0, 1)])).toBe(1);
    expect(levels([place('tilt', 0, 0, 2), place('bloom', 0, 1), place('cub', 0, 2)])).toBe(3);
  });
});
