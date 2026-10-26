/**
 * SomeonePaceRingController - the pace ring around the chest target.
 *
 * Pulses once per metronome beat (110 per minute): a soft swell and a slow
 * settle. This is the only rhythmic motion in the experience. Its color is
 * the user's own pace: coral neutral (fewer than 3 intervals), mint on pace,
 * amber close, coral far off.
 *
 * API: setShown(on), setGrade(grade), pulse()
 * Getters: isShown, colorState ("neutral" | "good" | "amber" | "red")
 * Must not: compute rate, play audio.
 */
import {PALETTE} from "./SomeoneConfig"
import {RateGrade} from "./SomeoneCompressionTracker"
import {buildFlatRing} from "./SomeoneFlatRing"
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

@component
export class SomeonePaceRingController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeonePaceRingController - pace ring on the chest</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Ring visual. Its mesh is replaced by a thin flat ring at awake; scaled for the pulse.")
  ringVisual: SceneObject
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("How much the ring swells on each beat (0.08 = 8 percent).")
  @widget(new SliderWidget(0, 0.2, 0.01))
  pulseAmount: number = 0.08

  @input
  @hint("Seconds for the show, hide and color fades (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.4

  @input
  @hint("Ring radius in cm, measured to the middle of the line. Sits just outside the hand target.")
  @widget(new SliderWidget(6, 18, 0.5))
  ringRadiusCm: number = 11

  @input
  @hint("Ring line width in cm. Thin and crisp, never a filled disc.")
  @widget(new SliderWidget(0.3, 2, 0.1))
  ringWidthCm: number = 0.8
  @ui.group_end

  private tweens = new SomeoneTweens()
  private fade: SomeoneVisualFade
  private baseScale = new vec3(1, 1, 1)
  private shown = false
  private alpha = 0
  private color: vec4 = PALETTE.coral
  private grade: RateGrade = "neutral"
  private swell = 0

  onAwake(): void {
    const root = this.ringVisual ? this.ringVisual : this.sceneObject
    if (this.ringVisual) {
      // Replace the authored torus with a thin flat ring built in cm.
      const rmv = this.ringVisual.getComponent("Component.RenderMeshVisual")
      if (rmv) {
        const half = this.ringWidthCm / 2
        rmv.mesh = buildFlatRing(this.ringRadiusCm - half, this.ringRadiusCm + half)
        this.ringVisual.getTransform().setLocalScale(vec3.one())
      }
      this.baseScale = this.ringVisual.getTransform().getLocalScale()
    }
    this.fade = new SomeoneVisualFade(root)
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

  setGrade(g: RateGrade): void {
    if (g === this.grade) return
    this.grade = g
    const target = g === "good" ? PALETTE.mint : g === "amber" ? PALETTE.amber : PALETTE.coral
    const from = this.color
    this.tweens.run("color", this.fadeSeconds, (t) => {
      this.color = vec4.lerp(from, target, t)
      this.apply()
    })
  }

  /** One beat: quick soft swell, slow settle. */
  pulse(): void {
    if (!this.shown) return
    this.tweens.run(
      "swell",
      0.1,
      (t) => {
        this.swell = t
        this.applyScale()
      },
      () => {
        this.tweens.run(
          "settle",
          0.38,
          (t) => {
            this.swell = 1 - t
            this.applyScale()
          },
          undefined,
          "ease-out-sine"
        )
      },
      "ease-out-sine"
    )
  }

  get isShown(): boolean {
    return this.shown
  }
  get colorState(): RateGrade {
    return this.grade
  }

  private apply(): void {
    this.fade.setColor(this.color, this.alpha * (0.85 + 0.15 * this.swell))
  }

  private applyScale(): void {
    if (!this.ringVisual) return
    const k = 1 + this.pulseAmount * this.swell
    this.ringVisual.getTransform().setLocalScale(this.baseScale.uniformScale(k))
    this.apply()
  }
}
