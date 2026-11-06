/**
 * Recolours the builder's black-and-white module drawings in a lacquer colour:
 * white areas take the colour, line work stays readable (dark lines on light
 * colours, light lines on dark colours). Alpha is preserved.
 */

export type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function luminance([r, g, b]: Rgb): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Colour of the line work for a given lacquer colour. */
export function inkFor(colour: Rgb): Rgb {
  if (luminance(colour) < 0.3) {
    return colour.map((channel) => Math.round(channel + (255 - channel) * 0.6)) as Rgb;
  }
  return colour.map((channel) => Math.round(channel * 0.12)) as Rgb;
}

/** Tints RGBA pixel data in place. */
export function tintPixels(data: Uint8ClampedArray, colour: Rgb): void {
  const ink = inkFor(colour);
  for (let i = 0; i < data.length; i += 4) {
    const light = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    data[i] = colour[0] * light + ink[0] * (1 - light);
    data[i + 1] = colour[1] * light + ink[1] * (1 - light);
    data[i + 2] = colour[2] * light + ink[2] * (1 - light);
  }
}

export function tintImageToCanvas(image: HTMLImageElement, hex: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  const colour = parseHex(hex);
  if (!context) return canvas;
  context.drawImage(image, 0, 0);
  if (!colour) return canvas;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  tintPixels(pixels.data, colour);
  context.putImageData(pixels, 0, 0);
  return canvas;
}

const tintCache = new Map<string, Promise<string>>();

/** Tinted version of an image as a data URL (cached per image and colour). */
export function tintedDataUrl(src: string, hex: string): Promise<string> {
  const key = `${src}|${hex}`;
  const cached = tintCache.get(key);
  if (cached) return cached;
  const promise = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        resolve(tintImageToCanvas(image, hex).toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error(`Image failed to load: ${src}`));
    image.src = src;
  });
  tintCache.set(key, promise);
  promise.catch(() => tintCache.delete(key));
  return promise;
}
