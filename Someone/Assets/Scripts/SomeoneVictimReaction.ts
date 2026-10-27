/**
 * SomeoneVictimReaction - the person's chest gives under each push.
 *
 * Plays the stand-in figure's "Compress" blend shape (baked in Blender by
 * tools/blender/build_human.py: the sternum dips about 3 cm with a smooth
 * falloff, the back stays on the ground): a quick press, then a slower
 * recoil, the way a chest yields and springs back. Purely visual feedback
 * for the preview stand-in; it never measures or reports depth.
 *
 * API: push()
 * Must not: count compressions or decide when a push is valid.
 */
import {SomeoneTweens} from "./SomeoneTween"

const SHAPE = "Compress"

@component
export class SomeoneVictimReaction extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneVictimReaction - chest gives under each push</span>')
  @ui.separator
  @input
  @hint("Root of the figure. Every mesh under it with a Compress blend shape reacts.")
  figureRoot: SceneObject

  @input
  @hint("How far the chest gives, 0 to 1 of the baked shape.")
  @widget(new SliderWidget(0, 1, 0.05))
  strength: number = 0.85

  private tweens = new SomeoneTweens()
  private visuals: RenderMeshVisual[] = []

  onAwake(): void {
    if (this.figureRoot) this.collect(this.figureRoot)
  }

  /** One push: quick give, slower recoil. No bounce. */
  push(): void {
    if (this.visuals.length === 0) return
    this.tweens.run(
      "press",
      0.09,
      (t) => this.apply(t),
      () => this.tweens.run("recoil", 0.32, (t) => this.apply(1 - t), undefined, "ease-out-sine"),
      "ease-out-sine"
    )
  }

  private apply(t: number): void {
    const w = t * this.strength
    for (const v of this.visuals) v.setBlendShapeWeight(SHAPE, w)
  }

  private collect(so: SceneObject): void {
    const v = so.getComponent("Component.RenderMeshVisual")
    if (v) this.visuals.push(v)
    for (let i = 0; i < so.getChildrenCount(); i++) this.collect(so.getChild(i))
  }
}
