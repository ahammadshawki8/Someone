/**
 * SomeoneHandCompression - counts compressions from the user's real hands.
 *
 * On Specs, both hands are on the chest during CPR, so a pinch per push is
 * not what a rescuer does. While `active` (set by Main when the chest target
 * is shown), this reads both tracked palms each frame. When a palm is on the
 * chest (inside `onChestRadiusCm` of the target and less than
 * `maxHeightAboveChestCm` above it), the palm height feeds a stroke detector,
 * and each push fires onCompression, the same path as a chest pinch.
 *
 * Preview stand-in: the preview's mouse is one pinching hand, so pinching the
 * target stays the way to compress there. This path is logic proven (LEAF
 * feeds a synthetic stroke through feedSample) and feel unproven until it
 * runs on real glasses.
 *
 * Events: onCompression   Getters: handsOnChest, strokeCount
 * Test hook: feedSample(heightCm) drives the detector as if a palm were on
 * the chest, and pauses live tracking for a moment so the two do not mix.
 * Must not: count or grade compressions (the state machine does).
 */
import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {SomeoneStrokeDetector} from "./SomeoneStrokeDetector"

@component
export class SomeoneHandCompression extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneHandCompression - hand-tracked compressions</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("The chest target. Palms near it count as hands on the chest.")
  chestTarget: SceneObject
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Horizontal distance from the target that still counts as on the chest, in cm.")
  @widget(new SliderWidget(8, 30, 1))
  onChestRadiusCm: number = 16

  @input
  @hint("Highest a palm can be above the target and still count, in cm. Keeps button presses above the chest out.")
  @widget(new SliderWidget(8, 40, 1))
  maxHeightAboveChestCm: number = 20

  @input
  @hint("Drop that counts as one push, in cm.")
  @widget(new SliderWidget(1, 4, 0.1))
  pushCm: number = 2.0

  @input
  @hint("Rise needed before the next push can count, in cm.")
  @widget(new SliderWidget(0.5, 4, 0.1))
  recoilCm: number = 1.5
  @ui.group_end

  /** Set by Main: listen only while the chest target is shown. */
  active = false

  private _onCompression = new Event<void>()
  get onCompression(): PublicApi<void> {
    return this._onCompression.publicApi()
  }

  private detector = new SomeoneStrokeDetector()
  private hands: HandInputData | null = null
  private onChest = false
  private injectedUntil = -1

  onAwake(): void {
    this.detector.pushCm = this.pushCm
    this.detector.recoilCm = this.recoilCm
    this.createEvent("OnStartEvent").bind(() => {
      this.hands = HandInputData.getInstance()
    })
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  get handsOnChest(): boolean {
    return this.onChest
  }
  get strokeCount(): number {
    return this.detector.strokeCount
  }

  /** Test hook: one height sample, as if a palm were on the chest. */
  feedSample(heightCm: number): void {
    this.injectedUntil = getTime() + 0.3
    this.onChest = true
    this.step(heightCm)
  }

  private onUpdate(): void {
    if (getTime() < this.injectedUntil) return
    if (!this.active || !this.hands || !this.chestTarget) {
      this.leaveChest()
      return
    }
    const chest = this.chestTarget.getTransform().getWorldPosition()
    let sum = 0
    let n = 0
    for (const side of ["left", "right"] as const) {
      const hand = this.hands.getHand(side)
      if (!hand || !hand.isTracked()) continue
      const palm = hand.getPalmCenter()
      if (!palm) continue
      const dx = palm.x - chest.x
      const dz = palm.z - chest.z
      const above = palm.y - chest.y
      if (Math.sqrt(dx * dx + dz * dz) > this.onChestRadiusCm) continue
      if (above > this.maxHeightAboveChestCm || above < -10) continue
      sum += above
      n++
    }
    if (n === 0) {
      this.leaveChest()
      return
    }
    this.onChest = true
    this.step(sum / n)
  }

  private step(heightCm: number): void {
    if (this.active && this.detector.feed(heightCm, getTime())) this._onCompression.invoke()
  }

  private leaveChest(): void {
    if (!this.onChest) return
    this.onChest = false
    this.detector.reset()
  }
}
