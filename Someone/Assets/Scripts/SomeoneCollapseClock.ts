/**
 * SomeoneCollapseClock - time since the collapse.
 *
 * Owns: elapsed seconds and whether the clock is running. Advanced by the
 * owner each frame with tick(dt), so a test harness can step it directly.
 * Must not: read scene time on its own, touch UI.
 */
export class SomeoneCollapseClock {
  private elapsedSec = 0
  private running = false

  start(): void {
    this.elapsedSec = 0
    this.running = true
  }

  stop(): void {
    this.running = false
  }

  tick(dt: number): void {
    if (this.running) this.elapsedSec += dt
  }

  get elapsed(): number {
    return this.elapsedSec
  }

  get isRunning(): boolean {
    return this.running
  }

  /** "m:ss" */
  static format(sec: number): string {
    const s = Math.max(0, Math.floor(sec))
    const m = Math.floor(s / 60)
    const r = s % 60
    return m + ":" + (r < 10 ? "0" : "") + r
  }
}
