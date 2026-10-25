/**
 * SomeoneSessionStats - running totals for the replay.
 *
 * Owns: total compressions, graded compressions, on-pace compressions, the
 * current and longest on-pace streak, and time to first compression.
 *
 * Definitions (stable, for tests):
 *   totalCompressions  every accepted pinch on the chest target.
 *   gradedCompressions compressions made once the rolling rate existed
 *                      (3 or more intervals in the current run).
 *   onPaceCompressions graded compressions whose rolling rate was 100-120.
 *   onPacePercent      round(100 * onPace / graded), 0 when nothing graded.
 *   longestStreak      most consecutive on-pace graded compressions. Neutral
 *                      (ungraded) compressions neither extend nor break it.
 *   timeToFirstSec     seconds from collapse to the first compression, or -1.
 *
 * Pure logic. Must not: touch scene, UI, or audio.
 */
import {RateGrade} from "./SomeoneCompressionTracker"

export interface StatsSnapshot {
  totalCompressions: number
  gradedCompressions: number
  onPaceCompressions: number
  onPacePercent: number
  longestStreak: number
  timeToFirstSec: number
}

export class SomeoneSessionStats {
  private total = 0
  private graded = 0
  private onPace = 0
  private streak = 0
  private longest = 0
  private firstAt = -1

  record(grade: RateGrade, elapsedSinceCollapse: number): void {
    this.total++
    if (this.firstAt < 0) this.firstAt = elapsedSinceCollapse
    if (grade === "neutral") return
    this.graded++
    if (grade === "good") {
      this.onPace++
      this.streak++
      if (this.streak > this.longest) this.longest = this.streak
    } else {
      this.streak = 0
    }
  }

  /** A pause (swap, AED) ends the current streak. */
  breakStreak(): void {
    this.streak = 0
  }

  reset(): void {
    this.total = 0
    this.graded = 0
    this.onPace = 0
    this.streak = 0
    this.longest = 0
    this.firstAt = -1
  }

  snapshot(): StatsSnapshot {
    return {
      totalCompressions: this.total,
      gradedCompressions: this.graded,
      onPaceCompressions: this.onPace,
      onPacePercent: this.graded > 0 ? Math.round((100 * this.onPace) / this.graded) : 0,
      longestStreak: this.longest,
      timeToFirstSec: this.firstAt
    }
  }
}
