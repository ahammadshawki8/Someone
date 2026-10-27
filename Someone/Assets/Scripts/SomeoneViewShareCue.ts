/**
 * SomeoneViewShareCue - shows, once, that the dispatcher now sees your view.
 *
 * When 911 connects, four thin mint viewfinder corners frame what the user is
 * looking at (head-locked, inside the Specs display), settle in like a camera
 * finding focus, hold for a moment, then fade away. The badge stays as the
 * lasting status. Stand-in: there is no real video share in this build.
 *
 * API: flash()   Getters: isShowing
 * Must not: decide when the dispatcher connects.
 */
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {PALETTE} from "./SomeoneConfig"
import {buildFlatCorners} from "./SomeoneFlatCorners"
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

@component
export class SomeoneViewShareCue extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneViewShareCue - "the dispatcher sees your view"</span>')
  @ui.separator
  @input
  @hint("Unlit material that honors alpha (the ring's material works).")
  material: Material

  @input
  @hint("Distance of the frame in front of the eyes, in cm.")
  @widget(new SliderWidget(40, 100, 1))
  distanceCm: number = 60

  @input
  @hint("Frame width and height in cm (keep inside the 32 by 37 degree display).")
  frameSizeCm: vec2 = new vec2(27, 31)

  @input
  @hint("Seconds the frame holds before fading.")
  @widget(new SliderWidget(1, 4, 0.25))
  holdSeconds: number = 2.25

  private tweens = new SomeoneTweens()
  private frame: SceneObject
  private fade: SomeoneVisualFade
  private showing = false
  private settle = 0

  onAwake(): void {
    this.frame = global.scene.createSceneObject("ViewShareFrame")
    this.frame.setParent(this.sceneObject)
    this.frame.layer = this.sceneObject.layer // render with the rest of the Lens
    const rmv = this.frame.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = buildFlatCorners(this.frameSizeCm.x, this.frameSizeCm.y, 4.5, 0.5)
    if (this.material) rmv.mainMaterial = this.material
    rmv.setRenderOrder(100)
    this.fade = new SomeoneVisualFade(this.frame)
    this.fade.setColor(PALETTE.mint, 0)
    this.frame.enabled = false
    this.createEvent("UpdateEvent").bind(() => this.follow())
  }

  get isShowing(): boolean {
    return this.showing
  }

  flash(): void {
    this.showing = true
    this.frame.enabled = true
    this.follow()
    this.tweens.run(
      "in",
      0.45,
      (t) => {
        this.settle = t
        this.fade.setColor(PALETTE.mint, t * 0.9)
      },
      () =>
        this.tweens.run("hold", this.holdSeconds, () => {}, () =>
          this.tweens.run(
            "out",
            0.6,
            (t) => this.fade.setColor(PALETTE.mint, (1 - t) * 0.9),
            () => {
              this.frame.enabled = false
              this.showing = false
            }
          )
        ),
      "ease-out-sine"
    )
  }

  private follow(): void {
    if (!this.showing) return
    const camT = WorldCameraFinderProvider.getInstance().getTransform()
    const rot = camT.getWorldRotation()
    const t = this.frame.getTransform()
    t.setWorldPosition(camT.getWorldPosition().add(rot.multiplyVec3(new vec3(0, 0, -this.distanceCm))))
    t.setWorldRotation(rot)
    // Settles in from slightly wide, like a camera finding focus.
    const s = 1.08 - 0.08 * this.settle
    t.setWorldScale(new vec3(s, s, s))
  }
}
