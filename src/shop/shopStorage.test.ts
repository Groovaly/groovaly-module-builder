import { STORAGE_KEY, parseStored, readComposition, sanitizeItems, writeComposition } from './shopStorage';

function memoryStore() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

describe('shop composition storage', () => {
  it('round-trips a composition', () => {
    const store = memoryStore();
    writeComposition(
      {
        items: [
          { id: 'a', typeId: 'tilt', w: 2, h: 1, col: 2, row: 0 },
          { id: 'b', typeId: 'bloom', w: 1, h: 1, col: 2, row: 1 },
        ],
        addFeet: true,
      },
      store,
    );
    const read = readComposition(store);
    expect(read?.items.map((item) => `${item.typeId}@${item.col},${item.row}`)).toEqual(['tilt@2,0', 'bloom@2,1']);
    expect(read?.addFeet).toBe(true);
  });

  it('distinguishes nothing stored (default) from an emptied composition', () => {
    const store = memoryStore();
    expect(readComposition(store)).toBeNull();
    writeComposition({ items: [], addFeet: false }, store);
    expect(readComposition(store)).toEqual({ items: [], addFeet: false });
  });

  it('drops unknown, floating, overlapping or out-of-grid modules', () => {
    const items = sanitizeItems([
      { id: '1', typeId: 'tilt', col: 0, row: 0 },
      { id: '2', typeId: 'grid', col: 0, row: 0 },
      { id: '3', typeId: 'cub', col: 4, row: 2 },
      { id: '4', typeId: 'sofa', col: 3, row: 0 },
      { id: '5', typeId: 'chest', col: 5, row: 0 },
      { id: '6', typeId: 'split', col: 1, row: 1 },
    ]);
    expect(items.map((item) => item.id)).toEqual(['1', '6']);
  });

  it('ignores corrupt or old data', () => {
    expect(parseStored('{oops')).toBeNull();
    expect(parseStored(JSON.stringify({ version: 0, items: [] }))).toBeNull();
    const store = memoryStore();
    store.data.set(STORAGE_KEY, JSON.stringify({ version: 1, items: 'x', addFeet: true }));
    expect(readComposition(store)).toEqual({ items: [], addFeet: false });
  });
});
