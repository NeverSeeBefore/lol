import { compositePixelStreamsAt } from './composite';
import { getStreamFrameIndex } from './timeline';
import { getCellTransitionProgress, mixPixelChannels, mixPixelColor, parsePixelColor, type PixelBezier } from './color';
import type { PixelScene } from './scene';

type Channels = [number, number, number, number];

type CellTransition = {
  from: Channels;
  to: Channels;
  start: number;
  frameDuration: number;
};

/** Samples independently timed streams and animates changes in the resulting pixel grid. */
export class PixelPlayback {
  readonly width: number;
  readonly height: number;
  readonly animated: boolean;
  private readonly streams: PixelScene[];
  private readonly transitionMs: number;
  private easing: PixelBezier;
  private frameKey = '';
  private colors: string[] = [];
  private transitions = new Map<number, CellTransition>();

  constructor(streams: PixelScene[], transitionMs = 0, easing: PixelBezier = [0.25, 0.1, 0.25, 1]) {
    if (!streams.length) throw new Error('At least one pixel stream is required.');
    this.streams = streams;
    this.width = streams[0].width;
    this.height = streams[0].height;
    this.animated = streams.some((scene) => scene.frames.length > 1);
    this.transitionMs = Math.max(0, Number.isFinite(transitionMs) ? transitionMs : 0);
    this.easing = easing;
  }

  setEasing(easing: PixelBezier) {
    this.easing = easing;
  }

  get hasTransitions() {
    return this.transitions.size > 0;
  }

  /** Returns true when a stream advanced to a different frame. */
  sample(elapsedMs: number, animate = true) {
    const time = animate ? Math.max(0, elapsedMs) : 0;
    const key = this.streams.map((scene) => getStreamFrameIndex(scene, time)).join(',');
    if (key === this.frameKey) return false;
    const nextColors =
      this.streams.length === 1
        ? this.streams[0].frames[getStreamFrameIndex(this.streams[0], time)].cells.map(
            (cell) => this.streams[0].palette[cell],
          )
        : compositePixelStreamsAt(this.streams, time);
    if (this.colors.length && animate && this.transitionMs > 0) {
      const baseFrameDuration = this.streams[0].frames[getStreamFrameIndex(this.streams[0], time)].durationMs;
      for (let index = 0; index < nextColors.length; index += 1) {
        if (nextColors[index] === this.colors[index]) continue;
        this.transitions.set(index, {
          from: this.channelsAt(index, time),
          to: parsePixelColor(nextColors[index]),
          start: time,
          frameDuration: baseFrameDuration,
        });
      }
    } else this.transitions.clear();
    this.colors = nextColors;
    this.frameKey = key;
    return true;
  }

  showFirstFrame() {
    this.frameKey = '';
    this.transitions.clear();
    this.sample(0, false);
  }

  colorAt(index: number, elapsedMs: number) {
    const transition = this.transitions.get(index);
    if (!transition) return this.colors[index];
    const progress = this.progressAt(index, elapsedMs, transition);
    if (progress === 1) {
      this.transitions.delete(index);
      return this.colors[index];
    }
    return mixPixelColor(transition.from, transition.to, progress);
  }

  private channelsAt(index: number, elapsedMs: number): Channels {
    const transition = this.transitions.get(index);
    if (!transition) return parsePixelColor(this.colors[index]);
    const progress = this.progressAt(index, elapsedMs, transition);
    return progress === 1 ? transition.to : mixPixelChannels(transition.from, transition.to, progress);
  }

  private progressAt(index: number, elapsedMs: number, transition: CellTransition) {
    return getCellTransitionProgress(
      elapsedMs - transition.start,
      transition.frameDuration,
      this.transitionMs,
      index,
      this.width,
      this.easing,
    );
  }
}
