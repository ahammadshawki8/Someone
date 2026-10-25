/**
 * SomeoneGlancePlacer - keeps the instruction card (and replay) in the same
 * glance as the hands, whatever the user's head height.
 *
 * Height rule (world Y): max(chestY + aboveChestCm, eyeY - tan(maxBelowEye) * d)
 *   kneeling over the figure -> rests aboveChestCm over the chest
 *   standing at the start    -> rises just enough to stay in view
 * Height and tilt ease slowly (no snapping), and each view keeps facing the
 * eyes. X and Z stay where they were authored.
 *
 * Plain logic. Owner calls snap() once after placement, then update(dt).
 * Must not: decide visibility.
 */
export class SomeoneGlancePlacer {
  private views: SceneObject[]
  private chest: SceneObject
  aboveChestCm = 30
  maxBelowEyeDeg = 20
  /** Ease rate (per second). Low = calm. */
  followRate = 1.8

  constructor(views: SceneObject[], chest: SceneObject) {
    this.views = views
    this.chest = chest
  }

  snap(eye: vec3): void {
    for (const v of this.views) this.place(v, eye, 1)
  }

  update(dt: number, eye: vec3): void {
    const k = 1 - Math.exp(-dt * this.followRate)
    for (const v of this.views) this.place(v, eye, k)
  }

  private place(v: SceneObject, eye: vec3, k: number): void {
    const t = v.getTransform()
    const p = t.getWorldPosition()
    const dx = p.x - eye.x
    const dz = p.z - eye.z
    const d = Math.sqrt(dx * dx + dz * dz)
    const chestY = this.chest.getTransform().getWorldPosition().y
    const lowest = eye.y - Math.tan((this.maxBelowEyeDeg * Math.PI) / 180) * d
    const targetY = Math.max(chestY + this.aboveChestCm, lowest)
    const y = p.y + (targetY - p.y) * k
    const np = new vec3(p.x, y, p.z)
    t.setWorldPosition(np)
    const dir = eye.sub(np).normalize()
    const targetRot = quat.lookAt(dir, vec3.up())
    t.setWorldRotation(k >= 1 ? targetRot : quat.slerp(t.getWorldRotation(), targetRot, k))
  }
}
