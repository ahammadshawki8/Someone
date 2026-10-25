/**
 * SomeoneRescueStateMachine - the single source of truth for the rescue flow.
 *
 * Owns: the flow step (base state), the one timed overlay prompt (SendForAED
 * or Swap), the queue of timed prompts waiting behind an unanswered prompt,
 * the collapse clock, the compression tracker, and session stats.
 *
 * Visible state = overlay ?? base. Exactly one card follows visible state,
 * so there is never more than one instruction card.
 *
 * Flow:
 *   Collapse -[seeSomeone]-> Check -[notBreathing]-> Call -[call911]->
 *   PlaceHands -[chest pinch]-> Compress
 *   t >= aedPromptAt   : overlay SendForAED (compressions keep counting) -[sent]
 *   t >= swapAt        : overlay Swap (ring hides, scoring pauses) -[swapped]
 *   sent + arrival     : AEDArrives (pads) -> StandClear -> simulated shock
 *                        by the stand-in AED -> Resume -[chest pinch]-> Compress
 *   shock + help delay : HelpArrives (badge + clock hide) -> Replay
 *
 * Queue rule: a timed prompt that fires while the user still owes a pinch
 * (or another overlay is up, or the AED sequence is running) waits in line,
 * and shows right after the next pinch resolves.
 *
 * Pure logic: Main feeds tick(dt), user actions and chest pinches, and reacts
 * to emitted events. Must not: touch scene objects, UI, or audio directly.
 */
import {
  CardAction,
  DEMO_TIMINGS,
  DispatcherCue,
  REAL_TIMINGS,
  RescueStateName,
  RescueTimings
} from "./SomeoneConfig"
import {CompressionResult, SomeoneCompressionTracker} from "./SomeoneCompressionTracker"
import {SomeoneCollapseClock} from "./SomeoneCollapseClock"
import {SomeoneSessionStats, StatsSnapshot} from "./SomeoneSessionStats"

type OverlayName = "SendForAED" | "Swap"
type QueuedPrompt = OverlayName | "AEDArrives" | "HelpArrives"

export type RescueEvent =
  | {type: "visibleStateChanged"; state: RescueStateName}
  | {type: "compression"; result: CompressionResult; total: number}
  | {type: "rateReset"}
  | {type: "dispatcherConnected"}
  | {type: "dispatcherCue"; cue: DispatcherCue}
  | {type: "aedPromptShown"}
  | {type: "aedPromptCleared"}
  | {type: "shock"}
  | {type: "helpArrived"}
  | {type: "replay"; stats: StatsSnapshot}
  | {type: "restarted"}

/** States in which the base flow is waiting for a pinch or running a sequence. */
const BASE_BUSY: RescueStateName[] = [
  "Collapse",
  "Check",
  "Call",
  "PlaceHands",
  "AEDArrives",
  "StandClear",
  "HelpArrives",
  "Replay"
]
/** States where queued prompts may NOT drain even after a pinch. */
const NO_DRAIN: RescueStateName[] = ["AEDArrives", "StandClear", "HelpArrives", "Replay"]

export class SomeoneRescueStateMachine {
  readonly clock = new SomeoneCollapseClock()
  readonly tracker = new SomeoneCompressionTracker()
  readonly stats = new SomeoneSessionStats()

  private timings: RescueTimings = REAL_TIMINGS
  private base: RescueStateName = "Collapse"
  private overlay: OverlayName | null = null
  private queue: QueuedPrompt[] = []
  private listeners: ((e: RescueEvent) => void)[] = []

  private aedPromptFired = false
  private swapFired = false
  private compressionStarted = false
  private dispatcherOn = false
  /** Elapsed (collapse clock) at which the AED arrives, or -1. */
  private aedArrivalAt = -1
  /** Elapsed at which help arrives, or -1. */
  private helpAt = -1
  /** Seconds left in the current automatic hold (AED sequence, help). */
  private holdLeft = -1
  /** Wall-clock seconds of the flow (keeps running after the clock stops). */
  private flowTime = 0

  // ---- Setup ---------------------------------------------------------------
  setDemoMode(demo: boolean): void {
    this.timings = demo ? DEMO_TIMINGS : REAL_TIMINGS
  }

  get activeTimings(): RescueTimings {
    return this.timings
  }

  addListener(fn: (e: RescueEvent) => void): void {
    this.listeners.push(fn)
  }

  /** Begin (or restart) the flow at the collapse. */
  start(): void {
    this.base = "Collapse"
    this.overlay = null
    this.queue = []
    this.aedPromptFired = false
    this.swapFired = false
    this.compressionStarted = false
    this.dispatcherOn = false
    this.aedArrivalAt = -1
    this.helpAt = -1
    this.holdLeft = -1
    this.flowTime = 0
    this.tracker.reset()
    this.stats.reset()
    this.clock.start()
    this.emit({type: "restarted"})
    this.emitVisible()
  }

  // ---- Getters (stable surface for Main and tests) --------------------------
  get visibleState(): RescueStateName {
    return this.overlay !== null ? this.overlay : this.base
  }
  get baseState(): RescueStateName {
    return this.base
  }
  get overlayState(): string {
    return this.overlay !== null ? this.overlay : "none"
  }
  get queuedPrompts(): string[] {
    return this.queue.slice()
  }
  get elapsed(): number {
    return this.clock.elapsed
  }
  get isDispatcherConnected(): boolean {
    return this.dispatcherOn
  }
  get hasStartedCompressions(): boolean {
    return this.compressionStarted
  }
  /** Ring + metronome: only while actively compressing (never during Swap). */
  get isCompressing(): boolean {
    return this.base === "Compress" && this.overlay !== "Swap"
  }
  get targetVisible(): boolean {
    const v = this.visibleState
    if (v === "PlaceHands" || v === "Compress" || v === "Resume") return true
    return this.overlay === "SendForAED" && (this.base === "Compress" || this.base === "Resume")
  }
  get aedPromptVisible(): boolean {
    return this.overlay === "SendForAED"
  }
  get padsVisible(): boolean {
    return this.base === "AEDArrives" || this.base === "StandClear"
  }
  get badgeVisible(): boolean {
    return this.dispatcherOn && this.base !== "HelpArrives" && this.base !== "Replay"
  }
  get clockVisible(): boolean {
    return this.base !== "HelpArrives" && this.base !== "Replay"
  }

  // ---- Inputs ----------------------------------------------------------------
  /** A card button was pressed. Returns true if it was accepted. */
  action(a: CardAction): boolean {
    const v = this.visibleState
    if (a === "seeSomeone" && v === "Collapse") {
      this.base = "Check"
    } else if (a === "notBreathing" && v === "Check") {
      this.base = "Call"
    } else if (a === "call911" && v === "Call") {
      this.base = "PlaceHands"
      this.dispatcherOn = true
      this.emit({type: "dispatcherConnected"})
      this.cue("connected")
      this.cue("placeHands")
    } else if (a === "sent" && this.overlay === "SendForAED") {
      this.overlay = null
      this.aedArrivalAt = this.clock.elapsed + this.timings.aedArrivesAfterSent
      this.emit({type: "aedPromptCleared"})
      this.cue("sent")
    } else if (a === "swapped" && this.overlay === "Swap") {
      this.overlay = null
      // New hands: start the rate window fresh, end the streak.
      this.tracker.reset()
      this.stats.breakStreak()
      this.emit({type: "rateReset"})
    } else {
      return false
    }
    this.drainAfterPinch()
    this.emitVisible()
    return true
  }

  /** One pinch on the chest target at wall time `t` (seconds). */
  chestPinched(t: number): boolean {
    const v = this.visibleState
    if (v === "PlaceHands" || (this.base === "Resume" && this.overlay !== "Swap")) {
      const first = !this.compressionStarted
      this.base = "Compress"
      this.compressionStarted = true
      this.recordCompression(t)
      if (first) this.cue("firstCompression")
      this.drainAfterPinch()
      this.emitVisible()
      return true
    }
    if (this.base === "Compress" && this.overlay !== "Swap") {
      this.recordCompression(t)
      return true
    }
    return false
  }

  /** Advance timers. `now` is wall time in seconds (for rate staleness). */
  tick(dt: number, now: number): void {
    this.flowTime += dt
    this.clock.tick(dt)
    const e = this.clock.elapsed

    if (this.isCompressing && this.tracker.checkStale(now)) {
      this.emit({type: "rateReset"})
    }

    if (!this.aedPromptFired && this.clock.isRunning && e >= this.timings.aedPromptAt) {
      this.aedPromptFired = true
      this.request("SendForAED")
    }
    if (
      !this.swapFired &&
      this.compressionStarted &&
      e >= this.timings.swapAt &&
      (this.base === "Compress" || this.base === "Resume")
    ) {
      this.swapFired = true
      this.request("Swap")
    }
    if (this.aedArrivalAt >= 0 && e >= this.aedArrivalAt) {
      this.aedArrivalAt = -1
      this.request("AEDArrives")
    }
    if (this.helpAt >= 0 && e >= this.helpAt) {
      this.helpAt = -1
      this.request("HelpArrives")
    }

    if (this.holdLeft >= 0) {
      this.holdLeft -= dt
      if (this.holdLeft < 0) this.onHoldDone()
    }
  }

  // ---- Internals -------------------------------------------------------------
  private recordCompression(t: number): void {
    const result = this.tracker.addCompression(t)
    this.stats.record(result.grade, this.clock.elapsed)
    this.emit({type: "compression", result, total: this.stats.snapshot().totalCompressions})
  }

  private busy(): boolean {
    return this.overlay !== null || BASE_BUSY.indexOf(this.base) >= 0
  }

  private request(p: QueuedPrompt): void {
    if (this.busy()) {
      this.queue.push(p)
      return
    }
    this.show(p)
    this.emitVisible()
  }

  private drainAfterPinch(): void {
    if (this.overlay !== null || this.queue.length === 0) return
    if (NO_DRAIN.indexOf(this.base) >= 0) return
    this.show(this.queue.shift() as QueuedPrompt)
  }

  private show(p: QueuedPrompt): void {
    if (p === "SendForAED") {
      this.overlay = "SendForAED"
      this.emit({type: "aedPromptShown"})
      this.cue("aedPrompt")
    } else if (p === "Swap") {
      this.overlay = "Swap"
      this.tracker.reset()
      this.stats.breakStreak()
      this.emit({type: "rateReset"})
      this.cue("swap")
    } else if (p === "AEDArrives") {
      this.base = "AEDArrives"
      this.tracker.reset()
      this.stats.breakStreak()
      this.emit({type: "rateReset"})
      this.holdLeft = this.timings.padsHold
      this.cue("aedArrives")
    } else if (p === "HelpArrives") {
      this.base = "HelpArrives"
      this.overlay = null
      this.queue = []
      this.clock.stop()
      this.holdLeft = this.timings.helpHold
      this.emit({type: "helpArrived"})
      this.cue("helpArrives")
    }
  }

  private onHoldDone(): void {
    this.holdLeft = -1
    if (this.base === "AEDArrives") {
      this.base = "StandClear"
      this.holdLeft = this.timings.standClearHold
      this.cue("standClear")
      this.emitVisible()
    } else if (this.base === "StandClear") {
      // The stand-in AED delivers the (simulated) shock. Not the user.
      this.emit({type: "shock"})
      this.base = "Resume"
      this.helpAt = this.clock.elapsed + this.timings.helpAfterShock
      this.cue("afterShock")
      // Anything that queued during the AED sequence shows now.
      if (this.overlay === null && this.queue.length > 0) {
        this.show(this.queue.shift() as QueuedPrompt)
      }
      this.emitVisible()
    } else if (this.base === "HelpArrives") {
      this.base = "Replay"
      this.emitVisible()
      this.emit({type: "replay", stats: this.stats.snapshot()})
    }
  }

  private cue(c: DispatcherCue): void {
    if (!this.dispatcherOn) return
    this.emit({type: "dispatcherCue", cue: c})
  }

  private emitVisible(): void {
    this.emit({type: "visibleStateChanged", state: this.visibleState})
  }

  private emit(e: RescueEvent): void {
    for (const fn of this.listeners) fn(e)
  }
}
