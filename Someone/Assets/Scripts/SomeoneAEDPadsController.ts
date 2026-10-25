/**
 * SomeoneAEDPadsController - AED pad placement overlay on the figure's chest
 * (upper right and lower left, the standard positions).
 *
 * API: setShown(on), shockPulse()   Getters: isShown
 * The shock is simulated and delivered by the stand-in AED, never the user;
 * shockPulse is one soft brightening, not a flash.
 * Must not: decide timing.
 */
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

@component
export class SomeoneAEDPadsController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneAEDPadsController - pad placement overlay</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Seconds for the show and hide fade (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.5
  @ui.group_end

  private tweens = new SomeoneTweens()
  private fade: SomeoneVisualFade
  private shown = false
  private alpha = 0
  private glow = 0

  onAwake(): void {
    this.fade = new SomeoneVisualFade(this.sceneObject)
    this.apply()
  }

  setShown(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    const from = this.alpha
    this.tweens.run("show", this.fadeSeconds, (t) => {
      this.alpha = from + ((on ? 1 : 0) - from) * t
      this.apply()
    })
  }

  shockPulse(): void {
    this.tweens.run(
      "glowUp",
      0.3,
      (t) => {
        this.glow = t
        this.apply()
      },
      () =>
        this.tweens.run("glowDown", 0.5, (t) => {
          this.glow = 1 - t
          this.apply()
        })
    )
  }

  get isShown(): boolean {
    return this.shown
  }

  private apply(): void {
    this.fade.setAlpha(Math.min(1, this.alpha * (0.7 + 0.3 * this.glow)))
  }
}
