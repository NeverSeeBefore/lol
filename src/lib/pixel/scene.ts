export interface PixelFrame {
  durationMs: number;
  cells: number[];
}

export interface PixelScene {
  version: 1;
  width: number;
  height: number;
  palette: string[];
  frames: PixelFrame[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Validate a scene imported from an untrusted JSON file before displaying it. */
export function validatePixelScene(value: unknown): PixelScene {
  if (!isRecord(value)) throw new Error('Pixel scene must be an object.');
  if (value.version !== 1) throw new Error('Unsupported pixel scene version (expected 1).');
  const { width, height, palette, frames } = value;
  if (!Number.isInteger(width) || (width as number) < 8 || (width as number) > 96) {
    throw new Error('Pixel scene width must be an integer from 8 to 96.');
  }
  if (!Number.isInteger(height) || (height as number) < 8 || (height as number) > 96) {
    throw new Error('Pixel scene height must be an integer from 8 to 96.');
  }
  if (
    !Array.isArray(palette) ||
    palette.length < 1 ||
    palette.length > 256 ||
    !palette.every((color) => typeof color === 'string' && /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color))
  ) {
    throw new Error('Pixel scene palette must contain 1–256 CSS hex colors.');
  }
  if (!Array.isArray(frames) || frames.length < 1 || frames.length > 72) {
    throw new Error('Pixel scene must contain 1–72 frames.');
  }
  frames.forEach((frame, frameIndex) => {
    if (
      !isRecord(frame) ||
      !Number.isFinite(frame.durationMs) ||
      (frame.durationMs as number) <= 0 ||
      (frame.durationMs as number) > 60000
    ) {
      throw new Error(`Frame ${frameIndex + 1} durationMs must be greater than 0 and at most 60000.`);
    }
    if (
      !Array.isArray(frame.cells) ||
      frame.cells.length !== (width as number) * (height as number) ||
      !frame.cells.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < palette.length)
    ) {
      throw new Error(`Frame ${frameIndex + 1} cells must contain valid palette indices for every pixel.`);
    }
  });
  return value as unknown as PixelScene;
}
