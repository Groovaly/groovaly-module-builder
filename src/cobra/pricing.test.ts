import { FINISHES, SIGNATURES } from './config';
import { countsFromBuilder, countsFromSignature, emptyCounts, priceCounts, quoteDelivery } from './pricing';

const valchromat = FINISHES[0];
const lacquer = FINISHES[1];
const hammered = FINISHES[2];

describe('Cobra pricing (same rules as the quoting workbook)', () => {
  it('reproduces the workbook example: Tilt + feet, lacquer, France = Alton 1,490 + 89 delivery', () => {
    const counts = countsFromBuilder([{ typeId: 'tilt' }], true);
    const result = priceCounts(counts, lacquer, 'France');
    expect(result.signature?.name).toBe('Alton');
    expect(result.compositionTotal).toBe(1490);
    expect(result.weightKg).toBe(34.7);
    expect(result.delivery).toMatchObject({ zone: 'Z1 FR+Benelux', bracket: '30–60 kg', cost: 89 });
    expect(result.total).toBe(1579);
  });

  it('sums modules sold alone when no signature matches, feet counted once', () => {
    const counts = countsFromBuilder([{ typeId: 'tilt' }, { typeId: 'cub' }, { typeId: 'bloom' }], true);
    const result = priceCounts(counts, valchromat, 'France');
    expect(result.signature).toBeNull();
    expect(result.compositionTotal).toBe(1190 + 790 + 1050 + 90);
    expect(priceCounts(counts, lacquer, 'France').compositionTotal).toBe(1450 + 950 + 1250 + 90);
  });

  it('applies the bundle price of every signature, in both finishes', () => {
    for (const signature of SIGNATURES) {
      const counts = countsFromSignature(signature);
      expect(priceCounts(counts, valchromat, 'France').compositionTotal).toBe(signature.prices.valchromat);
      expect(priceCounts(counts, hammered, 'France').compositionTotal).toBe(signature.prices.lacquer);
    }
  });

  it('tells Thelonious (no feet) from Maceo (feet)', () => {
    const withoutFeet = countsFromBuilder([{ typeId: 'tilt' }, { typeId: 'chest' }], false);
    const withFeet = countsFromBuilder([{ typeId: 'tilt' }, { typeId: 'chest' }], true);
    expect(priceCounts(withoutFeet, valchromat, 'France').signature?.name).toBe('Thelonious');
    expect(priceCounts(withFeet, valchromat, 'France').signature?.name).toBe('Maceo');
  });

  it('picks the weight bracket from its lower bound, per zone', () => {
    expect(quoteDelivery(9.9, 'France').cost).toBe(59);
    expect(quoteDelivery(10, 'France').cost).toBe(79);
    expect(quoteDelivery(60, 'Allemagne').cost).toBe(199);
    expect(quoteDelivery(250, 'Roumanie').cost).toBe(1679);
  });

  it('flags countries outside the covered zones', () => {
    const counts = emptyCounts();
    counts.bloom = 1;
    const result = priceCounts(counts, valchromat, 'Malte');
    expect(result.delivery.cost).toBeNull();
    expect(result.total).toBe(1050);
  });
});

import { parseAddressResponse } from './AddressAutocomplete';

describe('address autocomplete parsing', () => {
  it('maps BAN results to street, postcode and city, and skips bare municipalities', () => {
    const results = parseAddressResponse({
      features: [
        { properties: { label: '12 Rue des Martyrs 75009 Paris', name: '12 Rue des Martyrs', postcode: '75009', city: 'Paris', type: 'housenumber' } },
        { properties: { label: 'Paris', name: 'Paris', postcode: '75001', city: 'Paris', type: 'municipality' } },
      ],
    });
    expect(results).toEqual([{ label: '12 Rue des Martyrs 75009 Paris', street: '12 Rue des Martyrs', postcode: '75009', city: 'Paris' }]);
    expect(parseAddressResponse(null)).toEqual([]);
  });
});
