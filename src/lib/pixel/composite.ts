import type { PixelScene } from './scene';
import { getStreamFrameIndex } from './timeline';

function opaquePixel(color: string) {
  if (color.length === 5) return color[4] === '0' ? null : color.slice(0, 4);
  if (color.length === 9) return color.slice(7).toLowerCase() === '00' ? null : color.slice(0, 7);
  return color;
}

/** Later streams have priority. Any nonzero alpha is treated as fully opaque. */
export function compositePixelStreamsAt(streams: PixelScene[], elapsedMs: number) {
  if (!streams.length) throw new Error('At least one pixel stream is required.');
  const { width, height } = streams[0];
  const frames = streams.map((scene) => scene.frames[getStreamFrameIndex(scene, elapsedMs)]);
  const colors = new Array<string>(width * height);

  for (let index = 0; index < colors.length; index += 1) {
    const column = index % width;
    const row = Math.floor(index / width);
    colors[index] = '#00000000';
    for (let layer = streams.length - 1; layer >= 0; layer -= 1) {
      const scene = streams[layer];
      const x = Math.min(scene.width - 1, Math.floor(((column + 0.5) * scene.width) / width));
      const y = Math.min(scene.height - 1, Math.floor(((row + 0.5) * scene.height) / height));
      const color = opaquePixel(scene.palette[frames[layer].cells[y * scene.width + x]]);
      if (color) {
        colors[index] = color;
        break;
      }
    }
  }
  return colors;
}
