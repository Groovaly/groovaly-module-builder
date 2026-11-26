/**
 * Golden Age shop builder (groovaly.com/collections/golden-age#create-your-own).
 * White Pearl only. Prices, signature compositions and feet rules come from the
 * shared Golden Age catalogue (src/cobra/config.ts, mirroring the quoting
 * workbook); live prices and variant ids are read from Shopify by the page.
 */
import type { PlacedItem } from '../logic/grid';
import type { PriceKey } from '../cobra/config';

/** Shopify product handle of each module, and of the feet set. */
export const MODULE_HANDLES: Record<PriceKey, string> = {
  bloom: 'bloom',
  tilt: 'tilt',
  chest: 'chest',
  nest: 'nest',
  cub: 'cub',
  split: 'split',
  grid: 'grid',
  lean: 'lean',
  // One set of feet per composition (€90). Product to be created on Shopify.
  feet: 'golden-age-feet',
};

/** Shopify product handle of each signature composition (keyed by signature id). */
export const SIGNATURE_HANDLES: Record<string, string> = {
  otis: 'otis',
  alton: 'alton',
  tina: 'tina',
  janis: 'janis',
  sly: 'sly',
  thelonious: 'thelonious',
  maceo: 'maceo',
  patti: 'patti',
  lou: 'lou',
  james: 'james',
  curtis: 'curtis',
  wilson: 'wilson',
};

/** Countries Golden Age ships to (ISO codes, as Shopify reports the visitor's country). */
export const DELIVERABLE_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]; // EU except Cyprus and Malta (not delivered)

/** Product page suggested to visitors outside the delivery zone. */
// Absolute: the builder runs in an iframe on github.io, so a relative link would open there.
export const OUTSIDE_ZONE_URL = 'https://groovaly.com/products/bloom-console';

/**
 * Approximate capacity per module: LPs (12-inch) and 7-inch singles.
 * Modules not listed (Grid, Split, Nest) have no dedicated record capacity.
 */
export const VINYL_CAPACITY: Partial<Record<PriceKey, { lp?: number; singles?: number }>> = {
  cub: { lp: 80 },
  lean: { lp: 80 },
  tilt: { lp: 180 },
  bloom: { lp: 50 },
  chest: { singles: 300 },
};

/** Composition on the grid at first load: Tilt on feet, Split and Bloom on top (Patti without Nest). */
export const DEFAULT_COMPOSITION: PlacedItem[] = [
  { id: 'default-tilt', typeId: 'tilt', w: 2, h: 1, col: 2, row: 0 },
  { id: 'default-split', typeId: 'split', w: 1, h: 1, col: 2, row: 1 },
  { id: 'default-bloom', typeId: 'bloom', w: 1, h: 1, col: 3, row: 1 },
];
export const DEFAULT_FEET = true;

export const COPY = {
  cta: 'Add my composition to cart',
  adding: 'Adding your composition to cart…',
  empty: 'Drag modules onto the grid to start your composition.',
  priceNote: 'Price includes VAT where applicable. Shipping is calculated at checkout.',
  signatureMatch: (name: string) => `This composition is our ${name} signature design.`,
  /** Shown on the grid, under the dimensions. */
  capacity: (lp: number, singles: number) =>
    `Up to ${[lp > 0 ? `${lp} LPs` : '', singles > 0 ? `${singles} singles` : ''].filter(Boolean).join(' and ')}`,
  outsideZoneTitle: 'Golden Age ships within the European Union only.',
  outsideZoneBody: 'For delivery worldwide, discover Bloom Console.',
  outsideZoneLink: 'Discover Bloom Console',
  unavailable: 'Some modules of this composition are not available right now.',
  error: 'Something went wrong while adding your composition. Please try again.',
  wallRecommended: {
    title: 'Wall fixing is recommended for this composition.',
    body:
      'For safety and stability, we recommend securing the furniture to the wall. The assembly instructions explain the wall-fixing method. Screws, wall plugs and brackets are not included, as they depend on your wall type.',
  },
  wallStronglyRecommended: {
    title: 'Wall fixing is strongly recommended for this composition.',
    body:
      'For safety and stability, we strongly recommend securing the furniture to the wall. The assembly instructions explain the wall-fixing method. Screws, wall plugs and brackets are not included, as they depend on your wall type.',
  },
  preview: 'Preview mode: the cart is available on groovaly.com.',
};
