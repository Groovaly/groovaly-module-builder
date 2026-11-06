/**
 * Cobra seller page — every value Groovaly may need to change lives here.
 * After editing, push to `main`: the Pages workflow rebuilds the site.
 *
 * Prices, weights, signature compositions and delivery rates mirror Romain's
 * quoting workbook "Groovaly_GoldenAge_Chiffrage_Devis_Configurateur_06102026.xlsx"
 * (September 2026 price grid). When the workbook changes, update this file.
 */

/* ------------------------------------------------------------------ */
/* Access                                                              */
/* ------------------------------------------------------------------ */

/**
 * The password is never stored in clear. To change it, run:
 *   npm run cobra:password -- "new password"
 * and paste the printed hash below. Changing it logs out every device.
 *
 * Note: this is a gate, not real security — the page is a static site, so a
 * technical visitor could bypass it. Nothing secret is on the page (prices
 * are the public ones); the gate keeps the tool away from the public.
 */
export const PASSWORD_SALT = 'groovaly-cobra-v1:';
export const PASSWORD_SHA256 = 'ecc724a6437fb5c0d34c3aaec649b695bde3c28e80021bfe35e81c3a7c9b2eec';

/* ------------------------------------------------------------------ */
/* Where orders are sent                                               */
/* ------------------------------------------------------------------ */

/**
 * Formspree endpoint. Formspree emails each submission to Romain and keeps
 * it in the Formspree dashboard (exportable as CSV).
 * Recommended: create a dedicated "Cobra" form in Formspree and paste its
 * endpoint here, so store orders are kept apart from website quote requests.
 */
export const FORM_ENDPOINT = 'https://formspree.io/f/mqerwngq';

export const STORE_NAME = 'Cobra';

/* ------------------------------------------------------------------ */
/* Finishes                                                            */
/* ------------------------------------------------------------------ */

/** The workbook has two price columns: Valchromat (White Pearl) and lacquer. */
export type PriceTier = 'valchromat' | 'lacquer';

export type FinishId = 'white-pearl' | 'smooth-lacquer' | 'hammered-lacquer';

export type Finish = {
  id: FinishId;
  label: string;
  /** English label used in the composition text sent to Groovaly. */
  internalLabel: string;
  description: string;
  tier: PriceTier;
  isLacquer: boolean;
};

export const FINISHES: Finish[] = [
  {
    id: 'white-pearl',
    label: 'White Pearl',
    internalLabel: 'White Pearl',
    description: 'Valchromat teinté dans la masse, trois couches de vernis mat',
    tier: 'valchromat',
    isLacquer: false,
  },
  {
    id: 'smooth-lacquer',
    label: 'Laqué lisse',
    internalLabel: 'Smooth lacquer',
    description: 'MDF laqué, couleur au choix',
    tier: 'lacquer',
    isLacquer: true,
  },
  {
    id: 'hammered-lacquer',
    label: 'Laqué martelé',
    internalLabel: 'Hammered lacquer',
    description: 'MDF laqué à effet martelé, couleur au choix',
    tier: 'lacquer',
    isLacquer: true,
  },
];

export const SHEENS = ['Mat', 'Satiné', 'Brillant', 'Poli brillant'] as const;

/**
 * RAL Classic codes NOT offered in the colour picker: fluorescent, pearl and
 * metallic shades, which a solid lacquer cannot reproduce. To be confirmed
 * with LinhaRecta — remove a code from this list to offer it.
 */
export const RAL_EXCLUDED: string[] = [
  // fluorescent
  '1026', '2005', '2007', '3024', '3026', '6038',
  // pearl
  '1035', '1036', '2013', '3032', '3033', '4011', '4012', '5025', '5026', '6035', '6036', '7048', '8029', '9022', '9023',
  // metallic / micaceous iron
  '9006', '9007',
];

/* ------------------------------------------------------------------ */
/* Modules (workbook sheet "Données", MODULES)                         */
/* ------------------------------------------------------------------ */

export type PriceKey = 'bloom' | 'tilt' | 'chest' | 'nest' | 'cub' | 'split' | 'grid' | 'lean' | 'feet';

/** Order used for the signature matching key, as in the workbook. */
export const PRICE_KEYS: PriceKey[] = ['bloom', 'tilt', 'chest', 'nest', 'cub', 'split', 'grid', 'lean', 'feet'];

export type CatalogItem = { label: string; prices: Record<PriceTier, number>; weightKg: number };

/**
 * "feet" is one set of feet for the composition (the builder's "add feet"
 * switch), priced once, whatever the number of modules on the floor.
 */
export const CATALOG: Record<PriceKey, CatalogItem> = {
  bloom: { label: 'Bloom', prices: { valchromat: 1050, lacquer: 1250 }, weightKg: 25.2 },
  tilt: { label: 'Tilt', prices: { valchromat: 1190, lacquer: 1450 }, weightKg: 33.7 },
  chest: { label: 'Chest', prices: { valchromat: 1490, lacquer: 1790 }, weightKg: 37.3 },
  nest: { label: 'Nest', prices: { valchromat: 159, lacquer: 199 }, weightKg: 3.6 },
  cub: { label: 'Cub', prices: { valchromat: 790, lacquer: 950 }, weightKg: 19.4 },
  split: { label: 'Split', prices: { valchromat: 850, lacquer: 1050 }, weightKg: 20.9 },
  grid: { label: 'Grid', prices: { valchromat: 950, lacquer: 1190 }, weightKg: 25.8 },
  lean: { label: 'Lean', prices: { valchromat: 830, lacquer: 990 }, weightKg: 21.5 },
  feet: { label: 'Pieds', prices: { valchromat: 90, lacquer: 90 }, weightKg: 1 },
};

/* ------------------------------------------------------------------ */
/* Signature compositions (bundle price when the module counts match) */
/* ------------------------------------------------------------------ */

export type Signature = {
  id: string;
  name: string;
  modules: Partial<Record<PriceKey, number>>;
  prices: Record<PriceTier, number>;
};

export const SIGNATURES: Signature[] = [
  { id: 'otis', name: 'Otis', modules: { bloom: 1, feet: 1 }, prices: { valchromat: 1090, lacquer: 1290 } },
  { id: 'alton', name: 'Alton', modules: { tilt: 1, feet: 1 }, prices: { valchromat: 1250, lacquer: 1490 } },
  { id: 'tina', name: 'Tina', modules: { bloom: 1, grid: 1 }, prices: { valchromat: 1950, lacquer: 2390 } },
  { id: 'janis', name: 'Janis', modules: { bloom: 1, nest: 1, split: 1, feet: 1 }, prices: { valchromat: 2090, lacquer: 2490 } },
  { id: 'sly', name: 'Sly', modules: { bloom: 1, nest: 1, lean: 1, feet: 1 }, prices: { valchromat: 2090, lacquer: 2490 } },
  { id: 'thelonious', name: 'Thelonious', modules: { tilt: 1, chest: 1 }, prices: { valchromat: 2590, lacquer: 3190 } },
  { id: 'maceo', name: 'Maceo', modules: { tilt: 1, chest: 1, feet: 1 }, prices: { valchromat: 2690, lacquer: 3290 } },
  { id: 'patti', name: 'Patti', modules: { bloom: 1, tilt: 1, nest: 1, split: 1, feet: 1 }, prices: { valchromat: 3190, lacquer: 3790 } },
  { id: 'lou', name: 'Lou', modules: { bloom: 1, cub: 1, split: 1, grid: 1, feet: 1 }, prices: { valchromat: 3590, lacquer: 4290 } },
  { id: 'james', name: 'James', modules: { bloom: 1, tilt: 1, chest: 1, split: 1, feet: 1 }, prices: { valchromat: 4390, lacquer: 5290 } },
  { id: 'curtis', name: 'Curtis', modules: { bloom: 1, tilt: 1, chest: 1, nest: 1, grid: 1 }, prices: { valchromat: 4590, lacquer: 5490 } },
  {
    id: 'wilson',
    name: 'Wilson',
    modules: { bloom: 1, tilt: 1, chest: 1, nest: 2, cub: 1, split: 1, grid: 1 },
    prices: { valchromat: 5990, lacquer: 7290 },
  },
];

/* ------------------------------------------------------------------ */
/* Delivery (zone × weight bracket, incl. VAT)                         */
/* ------------------------------------------------------------------ */

/**
 * false (default, same as the website quotes): delivery is added to the price.
 * true: the price shown is "delivery included" and no delivery line is added.
 */
export const DELIVERY_INCLUDED = false;

/** Lower bound (kg) of each weight bracket. A weight equal to a bound falls in the higher bracket. */
export const WEIGHT_BRACKETS: Array<{ minKg: number; label: string }> = [
  { minKg: 0, label: '≤10 kg' },
  { minKg: 10, label: '10–30 kg' },
  { minKg: 30, label: '30–60 kg' },
  { minKg: 60, label: '60–100 kg' },
  { minKg: 100, label: '100–130 kg' },
  { minKg: 130, label: '130–200 kg' },
  { minKg: 200, label: '200 kg+' },
];

export const DELIVERY_RATES: Record<string, number[]> = {
  'Z1 FR+Benelux': [59, 79, 89, 139, 199, 259, 519],
  'Z2 Ouest': [79, 99, 129, 199, 289, 369, 739],
  'Z3 Centre': [139, 149, 239, 369, 559, 719, 1439],
  'Z4 Périphérie': [179, 199, 249, 379, 559, 739, 1479],
  'Z5 Sud-Est': [209, 239, 259, 339, 509, 659, 1319],
  'Z6 Roumanie': [329, 339, 349, 439, 649, 839, 1679],
};

/** Countries offered in the form, with their delivery zone (null = not covered: quote by hand). */
export const COUNTRY_ZONES: Array<{ country: string; zone: string | null }> = [
  { country: 'France', zone: 'Z1 FR+Benelux' },
  { country: 'Belgique', zone: 'Z1 FR+Benelux' },
  { country: 'Luxembourg', zone: 'Z1 FR+Benelux' },
  { country: 'Pays-Bas', zone: 'Z1 FR+Benelux' },
  { country: 'Allemagne', zone: 'Z2 Ouest' },
  { country: 'Italie', zone: 'Z2 Ouest' },
  { country: 'Espagne (péninsule)', zone: 'Z2 Ouest' },
  { country: 'Autriche', zone: 'Z3 Centre' },
  { country: 'Danemark', zone: 'Z3 Centre' },
  { country: 'Hongrie', zone: 'Z3 Centre' },
  { country: 'Pologne', zone: 'Z3 Centre' },
  { country: 'Slovaquie', zone: 'Z3 Centre' },
  { country: 'Slovénie', zone: 'Z3 Centre' },
  { country: 'Suède', zone: 'Z3 Centre' },
  { country: 'Tchéquie', zone: 'Z3 Centre' },
  { country: 'Croatie', zone: 'Z4 Périphérie' },
  { country: 'Finlande', zone: 'Z4 Périphérie' },
  { country: 'Irlande', zone: 'Z4 Périphérie' },
  { country: 'Lettonie', zone: 'Z4 Périphérie' },
  { country: 'Lituanie', zone: 'Z4 Périphérie' },
  { country: 'Portugal', zone: 'Z4 Périphérie' },
  { country: 'Bulgarie', zone: 'Z5 Sud-Est' },
  { country: 'Estonie', zone: 'Z5 Sud-Est' },
  { country: 'Grèce', zone: 'Z5 Sud-Est' },
  { country: 'Roumanie', zone: 'Z6 Roumanie' },
  { country: 'Chypre', zone: null },
  { country: 'Malte', zone: null },
];

export const COUNTRIES = COUNTRY_ZONES.map((entry) => entry.country);

/* ------------------------------------------------------------------ */
/* Notes shown to the seller                                           */
/* ------------------------------------------------------------------ */

export const PRICE_NOTES = [
  DELIVERY_INCLUDED
    ? 'Prix public TTC, livraison incluse.'
    : 'Prix public TTC. Livraison calculée selon le pays de livraison et le poids.',
  'Fabrication à la commande au Portugal : 8 à 12 semaines.',
];
