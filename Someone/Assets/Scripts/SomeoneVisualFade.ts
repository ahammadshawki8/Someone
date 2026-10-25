/**
 * SomeoneVisualFade - per-instance material control for authored visuals.
 *
 * Collects every RenderMeshVisual under a root, clones each material once
 * (so fading one object never recolors another), and exposes alpha + color
 * writes on mainPass.baseColor. Requires materials with a blend mode that
 * honors alpha (the bootstrap sets Normal on the Someone materials).
 *
 * Must not: decide when to fade. Callers own timing.
 */
export class SomeoneVisualFade {
  private passes: {pass: Pass; base: vec4}[] = []

  constructor(root: SceneObject) {
    this.collect(root)
  }

  private collect(so: SceneObject): void {
    const rmvs = so.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[]
    for (const rmv of rmvs) {
      const mat = rmv.mainMaterial
      if (isNull(mat)) continue
      const clone = mat.clone()
      rmv.mainMaterial = clone
      const c = clone.mainPass.baseColor as vec4
      this.passes.push({pass: clone.mainPass, base: new vec4(c.x, c.y, c.z, c.w)})
    }
    for (let i = 0; i < so.getChildrenCount(); i++) this.collect(so.getChild(i))
  }

  get count(): number {
    return this.passes.length
  }

  /** Multiply each visual's authored alpha by `a` (0..1). */
  setAlpha(a: number): void {
    for (const p of this.passes) {
      p.pass.baseColor = new vec4(p.base.x, p.base.y, p.base.z, p.base.w * a)
    }
  }

  /** Replace the RGB of every visual (alpha keeps its authored value times a). */
  setColor(rgb: vec4, a: number): void {
    for (const p of this.passes) {
      p.pass.baseColor = new vec4(rgb.x, rgb.y, rgb.z, p.base.w * a)
    }
  }
}
