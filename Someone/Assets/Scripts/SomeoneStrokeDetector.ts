/**
 * SomeoneStrokeDetector - turns a stream of hand heights over the chest into
 * compression events. Plain logic, no scene access.
 *
 * One compression = the hands drop at least `pushCm` below their last high
 * point. The detector then waits for at least `recoilCm` of rise (the chest
 * recoiling) before it can count again, so tracking jitter and a hand that
 * rests or drifts never count twice. Samples are lightly smoothed first.
 *
 * The event fires early in each push, at the same point every stroke, so the
 * intervals (and so the rate) stay true.
 *
 * Must not: grade rate, read hands, or claim depth. Height is only used to
 * see a stroke; the Lens never reports compression depth.
 */
export class SomeoneStrokeDetector {
  /** Drop below the last high point that counts as a push, in cm. */
  pushCm = 2.0
  /** Rise above the last low point needed before the next push, in cm. */
  recoilCm = 1.5
  /** Pushes closer than this are ignored (caps the rate at 240 per minute). */
  minIntervalSec = 0.25
  /** Exponential smoothing per sample (1 = raw). */
  smoothing = 0.5

  private y: number | null = null
  private peak = -Infinity
  private trough = Infinity
  private armed = true
  private lastStroke = -Infinity
  private strokes = 0

  reset(): void {
    this.y = null
    this.peak = -Infinity
    this.trough = Infinity
    this.armed = true
  }

  /** Feed one height sample (cm above the chest) at time t (s). True on a push. */
  feed(heightCm: number, t: number): boolean {
    this.y = this.y === null ? heightCm : this.y + (heightCm - this.y) * this.smoothing
    const y = this.y
    if (this.armed) {
      if (y > this.peak) this.peak = y
      if (this.peak - y >= this.pushCm && t - this.lastStroke >= this.minIntervalSec) {
        this.armed = false
        this.trough = y
        this.lastStroke = t
        this.strokes++
        return true
      }
    } else {
      if (y < this.trough) this.trough = y
      if (y - this.trough >= this.recoilCm) {
        this.armed = true
        this.peak = y
      }
    }
    return false
  }

  get strokeCount(): number {
    return this.strokes
  }
}
