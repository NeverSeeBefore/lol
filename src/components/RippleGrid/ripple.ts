export interface RippleImpulse {
  x: number;
  y: number;
  startedAt: number;
}

export interface RippleCell {
  energy: number;
  highlight: number;
  scale: number;
  formation: number;
}

export const RIPPLE_CYCLE_SECONDS = 10;
const WAVE_LAUNCHES = [5.15, 5.85, 6.55] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export function sampleRippleStage(elapsedSeconds: number) {
  const time = ((elapsedSeconds % RIPPLE_CYCLE_SECONDS) + RIPPLE_CYCLE_SECONDS) % RIPPLE_CYCLE_SECONDS;
  return {
    time,
    zoom: time < 0.6 ? 0.06 + smoothstep(0, 0.6, time) * 0.94 : 1 - smoothstep(8.05, 9.55, time) * 0.94,
    seed: 1 - smoothstep(0.55, 0.9, time) + smoothstep(9.3, 9.5, time),
  };
}

/** A cell first assembles from tiny squares, then reacts to three travelling wavefronts. */
export function sampleRippleCell(
  column: number,
  row: number,
  columns: number,
  rows: number,
  elapsedSeconds: number,
  impulses: readonly RippleImpulse[],
): RippleCell {
  const { time } = sampleRippleStage(elapsedSeconds);
  const dx = column - (columns - 1) / 2;
  const dy = row - (rows - 1) / 2;
  const distance = Math.hypot(dx * 0.85, dy * 1.08);
  const shape = 1 - smoothstep(5.85, 6.95, distance);
  const cellDelay = ((column * 17 + row * 29) % 11) * 0.025;
  const arrival = 0.45 + distance * 0.64 + cellDelay;
  const formation = smoothstep(arrival, arrival + 0.55, time);
  const visible = shape * formation * (1 - smoothstep(9.15, 9.5, time));
  const eyeHeight = 1 - smoothstep(1.2, 2, Math.abs(dy + 1.2));
  const eye = eyeHeight * (1 - smoothstep(0.2, 0.9, Math.abs(Math.abs(dx) - 2.2)));
  const eyeHalo = eyeHeight * (1 - smoothstep(0.2, 0.9, Math.abs(Math.abs(dx) - 3.2)));

  let pulse = 0;
  for (const launch of WAVE_LAUNCHES) {
    const age = time - launch;
    if (age < 0 || age > 2.15) continue;
    const offset = (distance - age * 4.1) / 0.9;
    pulse += Math.exp(-offset * offset) * (1 - age / 2.15);
  }
  for (const impulse of impulses) {
    const age = elapsedSeconds - impulse.startedAt;
    if (age < 0 || age > 2.5) continue;
    const rippleDistance = Math.hypot(column - impulse.x, row - impulse.y);
    const offset = (rippleDistance - age * 5.2) / 0.8;
    pulse += Math.exp(-offset * offset) * (1 - age / 2.5);
  }

  const energy = clamp(visible * (0.79 + 0.21 * (1 - smoothstep(4.8, 7.1, distance))));
  const highlight = clamp(visible * (eye * 0.99 + eyeHalo * 0.86 + pulse * 0.6));
  return { energy, highlight, scale: 0.84 + formation * 0.16 + pulse * 0.09, formation };
}
