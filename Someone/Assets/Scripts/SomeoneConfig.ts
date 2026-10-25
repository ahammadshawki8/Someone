/**
 * SomeoneConfig - shared constants for the Someone rescue flow.
 *
 * Owns: the palette, rate bands, real vs demo timings, and every line of
 * user-facing copy (card lines, button labels, dispatcher captions).
 * Pure data. No scene access. Edit copy here, in one place.
 *
 * Must not: hold runtime state, import scene components.
 *
 * Medical note: copy never claims CPR restarts a heart. CPR circulates
 * blood; only the simulated AED shock is presented as treating the rhythm.
 * Guidance aligns with the published rate of 100 to 120 per minute.
 */

// ---- Palette (the only colors in the experience) ---------------------------
export const PALETTE = {
  coral: new vec4(1.0, 0.353, 0.306, 1.0), // #FF5A4E ring and target only
  mint: new vec4(0.361, 0.949, 0.71, 1.0), // #5CF2B5 on pace
  amber: new vec4(1.0, 0.761, 0.302, 1.0), // #FFC24D caution
  warmWhite: new vec4(0.969, 0.961, 0.949, 1.0) // #F7F5F2 text
}

export function withAlpha(c: vec4, a: number): vec4 {
  return new vec4(c.x, c.y, c.z, a)
}

// ---- Rate bands (per minute) ------------------------------------------------
export const RATE = {
  goodMin: 100,
  goodMax: 120,
  /** Within this many per minute of the band reads amber; further reads red. */
  amberMargin: 10,
  /** Rolling window: rate uses the last N intervals (4 to 6 per brief). */
  windowIntervals: 5,
  /** Ring stays neutral until this many intervals exist. */
  minIntervals: 3,
  /** A gap longer than this (seconds) restarts the rolling window. */
  resetGapSec: 3.0,
  /** Guide tempo (metronome and ring pulse). */
  guideBpm: 110
}

// ---- Timings (seconds) ------------------------------------------------------
export interface RescueTimings {
  /** Elapsed since collapse when the AED prompt fires. */
  aedPromptAt: number
  /** Elapsed since collapse when the rescuer swap prompt fires. */
  swapAt: number
  /** Seconds after "Sent" until the AED arrives. */
  aedArrivesAfterSent: number
  /** Seconds after the shock until help arrives. */
  helpAfterShock: number
  /** How long the "pads go here" card shows before "Stand clear." */
  padsHold: number
  /** How long "Stand clear." shows before the simulated shock. */
  standClearHold: number
  /** How long "Help is here." shows before the replay. */
  helpHold: number
}

export const REAL_TIMINGS: RescueTimings = {
  aedPromptAt: 90,
  swapAt: 120,
  aedArrivesAfterSent: 60,
  helpAfterShock: 20,
  padsHold: 5,
  standClearHold: 3,
  helpHold: 5
}

export const DEMO_TIMINGS: RescueTimings = {
  aedPromptAt: 45,
  swapAt: 65,
  aedArrivesAfterSent: 25,
  helpAfterShock: 10,
  padsHold: 3.5,
  standClearHold: 2.5,
  helpHold: 4
}

// ---- State names ------------------------------------------------------------
export type RescueStateName =
  | "Collapse"
  | "Check"
  | "Call"
  | "PlaceHands"
  | "Compress"
  | "SendForAED"
  | "Swap"
  | "AEDArrives"
  | "StandClear"
  | "Resume"
  | "HelpArrives"
  | "Replay"

/** Button actions the instruction card can emit. */
export type CardAction = "seeSomeone" | "notBreathing" | "call911" | "sent" | "swapped"

export interface CardContent {
  line: string
  /** Button label, or null when the step has no button. */
  button: string | null
  action: CardAction | null
}

// ---- Copy -------------------------------------------------------------------
export const CARD_COPY: Record<RescueStateName, CardContent> = {
  Collapse: {line: "Someone collapsed.", button: "I see someone", action: "seeSomeone"},
  Check: {line: "Tap their shoulder. Are they breathing?", button: "Not breathing", action: "notBreathing"},
  Call: {line: "Get help now.", button: "Call 911", action: "call911"},
  PlaceHands: {line: "Push here.", button: null, action: null},
  Compress: {line: "Push hard and fast.", button: null, action: null},
  SendForAED: {line: "AED, 40 m. Send someone.", button: "Sent", action: "sent"},
  Swap: {line: "Switch with a helper if you can.", button: "Swapped", action: "swapped"},
  AEDArrives: {line: "The AED is here. Pads go here.", button: null, action: null},
  StandClear: {line: "Stand clear.", button: null, action: null},
  Resume: {line: "Resume compressions. Push here.", button: null, action: null},
  HelpArrives: {line: "Help is here.", button: null, action: null},
  Replay: {line: "", button: null, action: null}
}

export const CUE_COPY = {
  good: "Good.",
  faster: "Faster.",
  slower: "Slower."
}

export const BADGE_COPY = "Dispatcher connected, viewing"
export const CLOCK_CAPTION = "since collapse"
export const REPLAY_CLOSING = "You did not freeze."

/** Scripted dispatcher lines (stand-in for a real video-assisted call). */
export type DispatcherCue =
  | "connected"
  | "placeHands"
  | "firstCompression"
  | "aedPrompt"
  | "sent"
  | "swap"
  | "aedArrives"
  | "standClear"
  | "afterShock"
  | "helpArrives"

export const DISPATCHER_LINES: Record<DispatcherCue, string> = {
  connected: "911. I'm with you, and I can see what you see.",
  placeHands: "Put the heel of your hand on the center of their chest.",
  firstCompression: "Good. Push hard and fast, with the beat.",
  aedPrompt: "Point at someone and send them for the AED.",
  sent: "Help is on the way. Keep going.",
  swap: "If someone can take over, switch now. Keep the rhythm.",
  aedArrives: "The AED will guide the shock. Pads go where shown.",
  standClear: "Don't touch them while the AED works.",
  afterShock: "Start pushing again right away.",
  helpArrives: "The paramedics are with you now."
}

/** Seconds a caption stays before it fades. */
export const CAPTION_HOLD_SEC = 6
