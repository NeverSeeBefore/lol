import type { PixelScene } from './scene';

/** Sample one scene's own timeline. A stream never waits for another stream's frame boundary. */
export function getStreamFrameIndex(scene: PixelScene, elapsedMs: number) {
  const cycle = scene.frames.reduce((sum, frame) => sum + frame.durationMs, 0);
  let remaining = Math.max(0, elapsedMs) % cycle;
  for (let index = 0; index < scene.frames.length; index += 1) {
    if (remaining < scene.frames[index].durationMs) return index;
    remaining -= scene.frames[index].durationMs;
  }
  return scene.frames.length - 1;
}
