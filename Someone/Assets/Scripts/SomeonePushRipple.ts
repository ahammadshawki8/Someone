/**
 * SomeonePushRipple - one ring that travels out from the target per push.
 *
 * Feedback for each compression, colored by how the rate is doing: mint on
 * pace, amber close, coral far off or not yet graded. One-shot (no loop), so
 * the pace ring stays the only rhythm. A small pool so fast pushes overlap
 * cleanly.
 *
 * API: ripple(color)
 * Must not: grade the rate (Main passes the color).
 */
import {buildFlatRing} from "./SomeoneFlatRing"
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

const POOL = 4

@component
export class SomeonePushRipple extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeonePushRipple - a ring per push</span>')
  @ui.separator
  @input
  @hint("Unlit material that honors alpha (the ring's material works).")
  material: Material

  @input
  @hint("Start and end radius in cm.")
  radiiCm: vec2 = new vec2(11, 26)

  @input
  @hint("Seconds a ripple takes to travel out and fade.")
  @widget(new SliderWidget(0.3, 1.2, 0.05))
  seconds: number = 0.65

  private rings: {so: SceneObject; fade: SomeoneVisualFade; tweens: SomeoneTweens}[] = []
  private next = 0

  onAwake(): void {
    const mesh = buildFlatRing(0.94, 1.0, 96) // unit ring, scaled to radius
    for (let i = 0; i < POOL; i++) {
      const so = global.scene.createSceneObject("PushRipple" + i)
      so.setParent(this.sceneObject)
      so.layer = this.sceneObject.layer
      const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
      rmv.mesh = mesh
      if (this.material) rmv.mainMaterial = this.material
      rmv.setRenderOrder(60)
      const fade = new SomeoneVisualFade(so)
      fade.setAlpha(0)
      so.enabled = false
      this.rings.push({so, fade, tweens: new SomeoneTweens()})
    }
  }

  ripple(color: vec4): void {
    if (this.rings.length === 0) return
    const r = this.rings[this.next]
    this.next = (this.next + 1) % this.rings.length
    r.so.enabled = true
    const r0 = this.radiiCm.x
    const r1 = this.radiiCm.y
    r.tweens.run(
      "out",
      this.seconds,
      (t) => {
        const rad = r0 + (r1 - r0) * t
        r.so.getTransform().setLocalScale(new vec3(rad, 1, rad))
        r.fade.setColor(color, 0.75 * (1 - t))
      },
      () => (r.so.enabled = false),
      "ease-out-sine"
    )
  }
}
