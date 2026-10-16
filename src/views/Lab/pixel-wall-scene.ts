import type { PixelScene } from 'Src/lib/pixel';

const WIDTH = 96;
const HEIGHT = 52;
const FRAME_COUNT = 32;

const palette = [
  '#0b1222', // sky
  '#14233a', // deep sky
  '#1c3449', // cloud / horizon
  '#356d6a', // aurora
  '#5fae9c', // aurora highlight
  '#d7e7d1', // stars and moon
  '#829aa4', // moon shadow
  '#101b2b', // distant city
  '#1c2839', // near city
  '#f1bd77', // windows
  '#a3c7c1', // cool windows
  '#30475a', // street
  '#f2dba9', // moving light
];

const buildings = [
  [0, 36, 14],
  [12, 30, 10],
  [22, 38, 16],
  [36, 32, 14],
  [50, 36, 12],
  [62, 28, 16],
  [78, 34, 10],
  [88, 38, 8],
];

const stars = [
  [6, 8],
  [19, 4],
  [33, 12],
  [47, 6],
  [61, 10],
  [78, 4],
  [89, 14],
];

/** A 4.16-second seamless pixel skyline loop, built once per playback speed. */
export function createPixelWallScene(frameDurationMs = 240): PixelScene {
  const frames = Array.from({ length: FRAME_COUNT }, (_, frame) => {
    const phase = (frame / FRAME_COUNT) * Math.PI * 2;
    const cells = Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
      const x = index % WIDTH;
      const y = Math.floor(index / WIDTH);
      let color = y < 16 ? 0 : y < 30 ? 1 : 2;

      // Two periodic ribbons drift across the skyline without a jump at the loop boundary.
      const ribbon = 16 + Math.sin((x / WIDTH) * Math.PI * 2 + phase) * 3.6;
      if (y > 10 && y < 26 && Math.abs(y - ribbon) < 3.2) color = 3;
      if (y > 10 && y < 26 && Math.abs(y - ribbon) < 1.1) color = 4;

      // Moon and a few stars sit above the moving atmosphere.
      const moonDistance = Math.hypot(x - 65, y - 10);
      if (moonDistance < 5.5) color = x < 65 && y < 10 ? 6 : 5;
      for (let star = 0; star < stars.length; star += 1) {
        const [starX, starY] = stars[star];
        if (x === starX && y === starY && (frame + star * 5) % 16 < 11) color = 5;
      }

      // The silhouette and window rhythm remain stable while the lights breathe.
      for (const [left, roof, width] of buildings) {
        if (x >= left && x < left + width && y >= roof && y < 48) {
          color = y >= 42 ? 8 : 7;
          if (y > roof + 2 && y < 44 && (x - left) % 5 === 2 && y % 5 === 0) {
            color = (x * 7 + y * 3 + Math.floor(frame / 8)) % 5 === 0 ? 10 : 9;
          }
        }
      }

      if (y >= 48) color = 11;
      if (y === 48 && (x - frame * 2 + WIDTH) % WIDTH < 4) color = 12;
      return color;
    });
    return { durationMs: frameDurationMs, cells };
  });

  return { version: 1, width: WIDTH, height: HEIGHT, palette, frames };
}

/** Transparent second stream with its own 3.6-second loop. */
export function createPixelWallMeteorStream(): PixelScene {
  const frames = Array.from({ length: 24 }, (_, frame) => {
    const headX = -12 + frame * 5;
    const headY = 7 + Math.round(Math.sin((frame / 24) * Math.PI * 2) * 2);
    const cells = Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
      const x = index % WIDTH;
      const y = Math.floor(index / WIDTH);
      const distance = headX - x;
      if (distance < 0 || distance > 9 || Math.abs(y - (headY - distance * 0.35)) > 0.8) return 0;
      if (distance < 2) return 2;
      return distance < 5 ? 1 : 3;
    });
    return { durationMs: 150, cells };
  });
  return {
    version: 1,
    width: WIDTH,
    height: HEIGHT,
    palette: ['#0000', '#ffce91', '#fff4d5', '#6bbbaa'],
    frames,
  };
}
