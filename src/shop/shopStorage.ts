/**
 * Keeps the visitor's composition in the browser (localStorage of the builder
 * site), so it is still there when they come back. After an add to cart the
 * stored composition is emptied: going back from the cart shows an empty
 * builder. A first visit (nothing stored) shows the default composition.
 * Storage may be unavailable (private mode, strict settings): everything then
 * works without it.
 */
import { MODULES } from '../components/ModuleBuilder';
import { GRID_COLS, GRID_ROWS, canPlace, rebuildOccupancy, type PlacedItem } from '../logic/grid';

export const STORAGE_KEY = 'groovaly-golden-age-shop-composition';
const VERSION = 1;

export type StoredComposition = { items: PlacedItem[]; addFeet: boolean };

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function storage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Keeps only modules that are known and validly placed (bottom-up). */
export function sanitizeItems(value: unknown): PlacedItem[] {
  if (!Array.isArray(value)) return [];
  const widths = new Map<string, 1 | 2>(MODULES.map((moduleItem) => [moduleItem.id, moduleItem.w]));
  const candidates = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      typeId: typeof item.typeId === 'string' ? item.typeId : '',
      col: Number(item.col),
      row: Number(item.row),
    }))
    .filter((item) => item.id && widths.has(item.typeId) && Number.isInteger(item.col) && Number.isInteger(item.row))
    .sort((a, b) => a.row - b.row || a.col - b.col);

  const kept: PlacedItem[] = [];
  for (const item of candidates) {
    const w = widths.get(item.typeId) as 1 | 2;
    if (item.col < 0 || item.row < 0 || item.col + w > GRID_COLS || item.row >= GRID_ROWS) continue;
    if (!canPlace(item.col, item.row, w, rebuildOccupancy(kept))) continue;
    if (item.typeId === 'nest' && item.row === 0) continue;
    kept.push({ id: item.id, typeId: item.typeId, w, h: 1, col: item.col, row: item.row });
  }
  return kept;
}

export function parseStored(raw: string | null): StoredComposition | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; items?: unknown; addFeet?: unknown };
    if (parsed.version !== VERSION) return null;
    const items = sanitizeItems(parsed.items);
    return { items, addFeet: items.length > 0 && parsed.addFeet === true };
  } catch {
    return null;
  }
}

export function readComposition(store: StorageLike | null = storage()): StoredComposition | null {
  try {
    return parseStored(store?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writeComposition(composition: StoredComposition, store: StorageLike | null = storage()): void {
  try {
    store?.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: VERSION,
        items: composition.items.map(({ id, typeId, col, row }) => ({ id, typeId, col, row })),
        addFeet: composition.addFeet,
      }),
    );
  } catch {
    /* storage unavailable: nothing is kept */
  }
}
