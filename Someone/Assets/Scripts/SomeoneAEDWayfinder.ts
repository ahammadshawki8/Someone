/**
 * SomeoneAEDWayfinder - points toward the (scripted) AED when it is needed.
 *
 * While shown: a small amber arrow rides the edge of the view, on the side
 * the AED is on, pointing toward it, and a gentle chime plays from the AED's
 * direction (spatial audio on the authored AEDBeacon), repeating calmly.
 *
 * API: setShown(on)   Getters: isShown, chimeCount
 * Must not: decide when the AED prompt appears (state machine does).
 */
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

@component
export class SomeoneAEDWayfinder extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneAEDWayfinder - edge arrow + directional chime</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Arrow visual. Its local +Y is the pointing direction.")
  arrow: SceneObject

  @input
  @hint("Where the AED is (the chime plays from here). Move it to change the direction.")
  aedBeacon: SceneObject

  @input
  @hint("Chime sound, played from the AED beacon.")
  chimeSound: AudioTrackAsset
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Distance of the arrow in front of the eyes, in cm.")
  @widget(new SliderWidget(40, 100, 1))
  arrowDistanceCm: number = 60

  @input
  @hint("How far from the view center the arrow sits, in cm (keep inside the display).")
  @widget(new SliderWidget(4, 16, 0.5))
  edgeOffsetCm: number = 10

  @input
  @hint("Seconds between chimes while the prompt is up.")
  @widget(new SliderWidget(2, 10, 0.5))
  chimeIntervalSec: number = 4

  @input
  @hint("Chime volume.")
  @widget(new SliderWidget(0, 1, 0.05))
  chimeVolume: number = 0.8
  @ui.group_end

  private tweens = new SomeoneTweens()
  private fade: SomeoneVisualFade
  private audio: AudioComponent
  private shown = false
  private alpha = 0
  private untilChime = 0
  private chimes = 0
  private placed = false

  onAwake(): void {
    this.fade = new SomeoneVisualFade(this.arrow ? this.arrow : this.sceneObject)
    this.fade.setAlpha(0)
    if (this.arrow) this.arrow.enabled = false
    const host = this.aedBeacon ? this.aedBeacon : this.sceneObject
    this.audio = host.createComponent("Component.AudioComponent") as AudioComponent
    if (this.chimeSound) this.audio.audioTrack = this.chimeSound
    this.audio.volume = this.chimeVolume
    this.createEvent("OnStartEvent").bind(() => {
      this.audio.playbackMode = Audio.PlaybackMode.LowPower
      const sa = this.audio.spatialAudio
      if (sa) {
        sa.enabled = true
        sa.positionEffect.enabled = true
        sa.distanceEffect.enabled = true
        sa.distanceEffect.minDistance = 100
        sa.distanceEffect.maxDistance = 2000
      }
    })
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  setShown(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    if (on) {
      if (this.arrow) this.arrow.enabled = true
      this.placed = false
      this.untilChime = 0
    }
    const from = this.alpha
    this.tweens.run(
      "show",
      0.45,
      (t) => {
        this.alpha = from + ((on ? 1 : 0) - from) * t
        this.fade.setAlpha(this.alpha)
      },
      () => {
        if (!on && this.arrow) this.arrow.enabled = false
      }
    )
  }

  get isShown(): boolean {
    return this.shown
  }
  get chimeCount(): number {
    return this.chimes
  }

  private onUpdate(): void {
    if (!this.shown) return
    const dt = getDeltaTime()
    this.untilChime -= dt
    if (this.untilChime <= 0) {
      this.untilChime = this.chimeIntervalSec
      this.chimes++
      if (this.audio.audioTrack) {
        if (this.audio.isPlaying()) this.audio.stop(false)
        this.audio.play(1)
      }
    }
    this.placeArrow(dt)
  }

  private placeArrow(dt: number): void {
    if (!this.arrow || !this.aedBeacon) return
    const camT = WorldCameraFinderProvider.getInstance().getTransform()
    const camPos = camT.getWorldPosition()
    const camRot = camT.getWorldRotation()
    const toAed = this.aedBeacon.getTransform().getWorldPosition().sub(camPos)
    const local = camRot.invert().multiplyVec3(toAed)
    // 2D direction in the view plane (x right, y up). Behind you: use the side.
    let dx = local.x
    let dy = local.y
    if (local.z > 0 && Math.abs(dx) < 1) dx = 1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.0001) {
      dx = 1
      dy = 0
    } else {
      dx /= len
      dy /= len
    }
    // Keep it low-ish and to the side: squash vertical travel.
    const offLocal = new vec3(dx * this.edgeOffsetCm, dy * this.edgeOffsetCm * 0.6 - 3, -this.arrowDistanceCm)
    const targetPos = camPos.add(camRot.multiplyVec3(offLocal))
    const angle = Math.atan2(dy, dx) - Math.PI / 2
    const targetRot = camRot.multiply(quat.angleAxis(angle, new vec3(0, 0, 1)))
    const t = this.arrow.getTransform()
    if (!this.placed) {
      t.setWorldPosition(targetPos)
      t.setWorldRotation(targetRot)
      this.placed = true
      return
    }
    const k = 1 - Math.exp(-dt * 5) // calm follow, no snapping
    t.setWorldPosition(vec3.lerp(t.getWorldPosition(), targetPos, k))
    t.setWorldRotation(quat.slerp(t.getWorldRotation(), targetRot, k))
  }
}
