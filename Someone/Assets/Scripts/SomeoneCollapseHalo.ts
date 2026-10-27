/**
 * SomeoneCollapseHalo - marks the person on the ground from a distance.
 *
 * A thin coral ring on the floor around the figure. It blooms open (scale
 * 0.85 to 1, fade in) when the person collapses, so a passer-by sees where
 * to go from across the plaza, and fades away once compressions start: by
 * then the target on the chest carries the attention. No pulsing; the pace
 * ring stays the only rhythm.
 *
 * API: setShown(on)   Getters: isShown
 * Must not: decide when it shows (Main does, from the state machine).
 */
import {PALETTE} from "./SomeoneConfig"
import {buildFlatRing} from "./SomeoneFlatRing"
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

@component
export class SomeoneCollapseHalo extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneCollapseHalo - the person, marked from afar</span>')
  @ui.separator
  @input
  @hint("Unlit material that honors alpha (the ring's material works).")
  material: Material

  @input
  @hint("Halo radius in cm (around the whole body).")
  @widget(new SliderWidget(60, 160, 1))
  radiusCm: number = 112

  @input
  @hint("Line width in cm.")
  @widget(new SliderWidget(0.5, 4, 0.1))
  widthCm: number = 1.6

  private tweens = new SomeoneTweens()
  private ring: SceneObject
  private fade: SomeoneVisualFade
  private shown = false
  private alpha = 0

  onAwake(): void {
    this.ring = global.scene.createSceneObject("CollapseHaloRing")
    this.ring.setParent(this.sceneObject)
    this.ring.layer = this.sceneObject.layer
    const rmv = this.ring.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = buildFlatRing(this.radiusCm - this.widthCm / 2, this.radiusCm + this.widthCm / 2, 160)
    if (this.material) rmv.mainMaterial = this.material
    this.fade = new SomeoneVisualFade(this.ring)
    this.apply()
  }

  get isShown(): boolean {
    return this.shown
  }

  setShown(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    const from = this.alpha
    this.tweens.run("show", on ? 0.9 : 0.6, (t) => {
      this.alpha = from + ((on ? 1 : 0) - from) * t
      this.apply()
    }, undefined, "ease-out-sine")
  }

  private apply(): void {
    this.fade.setColor(PALETTE.coral, this.alpha * 0.85)
    const s = 0.85 + 0.15 * this.alpha
    this.ring.getTransform().setLocalScale(new vec3(s, 1, s))
  }
}
