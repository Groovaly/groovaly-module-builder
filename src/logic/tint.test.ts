import { inkFor, parseHex, tintPixels } from './tint';

describe('module tinting', () => {
  it('parses hex colours', () => {
    expect(parseHex('#86A47C')).toEqual([134, 164, 124]);
    expect(parseHex('nope')).toBeNull();
  });

  it('turns white into the colour and keeps black lines dark on a light colour', () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    tintPixels(pixels, [134, 164, 124]);
    expect(Array.from(pixels.slice(0, 4))).toEqual([134, 164, 124, 255]);
    expect(pixels[4]).toBeLessThan(30);
  });

  it('draws light lines on a dark colour so the drawing stays readable', () => {
    const ink = inkFor([10, 10, 13]);
    expect(ink[0]).toBeGreaterThan(140);
  });

  it('preserves transparency', () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 0]);
    tintPixels(pixels, [200, 0, 0]);
    expect(pixels[3]).toBe(0);
  });
});
