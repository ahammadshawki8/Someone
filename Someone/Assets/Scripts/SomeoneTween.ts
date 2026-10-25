/**
 * SomeoneTween - keyed tweens for slow 300-500 ms eases (SIK animate).
 * Starting a tween on a key cancels the previous one on that key.
 * Must not: hold domain state.
 */
import animate, {CancelFunction} from "SpectaclesInteractionKit.lspkg/Utils/animate"

// ---- Tweens ------------------------------------------------------------------
/** Keyed tweens: starting a tween on a key cancels the previous one. */
export class SomeoneTweens {
  private cancels: {[key: string]: CancelFunction} = {}

  run(
    key: string,
    durationSec: number,
    update: (t: number) => void,
    ended?: () => void,
    easing: "ease-in-out-sine" | "ease-out-sine" | "ease-in-sine" | "linear" = "ease-in-out-sine"
  ): void {
    this.cancel(key)
    if (durationSec <= 0) {
      update(1)
      if (ended) ended()
      return
    }
    this.cancels[key] = animate({
      duration: durationSec,
      easing: easing,
      update: update,
      ended: () => {
        delete this.cancels[key]
        if (ended) ended()
      }
    })
  }

  cancel(key: string): void {
    const c = this.cancels[key]
    if (c) {
      c()
      delete this.cancels[key]
    }
  }
}

export function setTextAlpha(t: Text, base: vec4, a: number): void {
  t.textFill.color = new vec4(base.x, base.y, base.z, base.w * a)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
