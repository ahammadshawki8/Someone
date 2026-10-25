/**
 * SomeoneCompressionTracker - turns pinch timestamps into a rolling rate.
 *
 * Owns: the timestamps of compressions in the current run of pushing, the
 * rolling rate (per minute) from the last RATE.windowIntervals intervals,
 * and the grade of the latest compression.
 *
 * Grading:
 *   fewer than RATE.minIntervals intervals -> "neutral" (not graded)
 *   100 to 120 per minute                  -> "good"
 *   within 10 of the band (90-99, 121-130) -> "amber"
 *   further off                            -> "red"
 *
 * Pure logic. No scene access. Times are seconds (getTime()).
 * Must not: play audio, touch visuals, know about the state machine.
 */
import {RATE} from "./SomeoneConfig"

export type RateGrade = "neutral" | "good" | "amber" | "red"
export type RateDirection = "good" | "faster" | "slower" | null

export interface CompressionResult {
  /** Rolling rate per minute, or null while neutral. */
  rate: number | null
  grade: RateGrade
  direction: RateDirection
}

export class SomeoneCompressionTracker {
  private stamps: number[] = []
  private lastResult: CompressionResult = {rate: null, grade: "neutral", direction: null}

  /** Record one compression at time `t` (seconds). */
  addCompression(t: number): CompressionResult {
    const prev = this.stamps.length > 0 ? this.stamps[this.stamps.length - 1] : null
    if (prev !== null && t - prev > RATE.resetGapSec) {
      // A long pause restarts the rolling window.
      this.stamps = []
    }
    this.stamps.push(t)
    // Keep only what the window needs (window intervals = window + 1 stamps).
    const keep = RATE.windowIntervals + 1
    if (this.stamps.length > keep) {
      this.stamps.splice(0, this.stamps.length - keep)
    }
    this.lastResult = this.evaluate()
    return this.lastResult
  }

  /** Forget the current run (rescuer swap, AED pause, restart). */
  reset(): void {
    this.stamps = []
    this.lastResult = {rate: null, grade: "neutral", direction: null}
  }

  /** If no compression arrived for RATE.resetGapSec, fall back to neutral. */
  checkStale(now: number): boolean {
    if (this.stamps.length === 0) return false
    const last = this.stamps[this.stamps.length - 1]
    if (now - last > RATE.resetGapSec && this.lastResult.grade !== "neutral") {
      this.stamps = []
      this.lastResult = {rate: null, grade: "neutral", direction: null}
      return true
    }
    return false
  }

  get result(): CompressionResult {
    return this.lastResult
  }

  get intervalCount(): number {
    return Math.max(0, this.stamps.length - 1)
  }

  private evaluate(): CompressionResult {
    const n = this.intervalCount
    if (n < RATE.minIntervals) {
      return {rate: null, grade: "neutral", direction: null}
    }
    const span = this.stamps[this.stamps.length - 1] - this.stamps[0]
    const meanInterval = span / n
    const rate = meanInterval > 0 ? 60 / meanInterval : 999
    return {rate, grade: SomeoneCompressionTracker.gradeRate(rate), direction: SomeoneCompressionTracker.directionFor(rate)}
  }

  static gradeRate(rate: number): RateGrade {
    if (rate >= RATE.goodMin && rate <= RATE.goodMax) return "good"
    if (rate >= RATE.goodMin - RATE.amberMargin && rate <= RATE.goodMax + RATE.amberMargin) return "amber"
    return "red"
  }

  static directionFor(rate: number): RateDirection {
    if (rate < RATE.goodMin) return "faster"
    if (rate > RATE.goodMax) return "slower"
    return "good"
  }
}
