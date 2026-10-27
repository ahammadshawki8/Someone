/**
 * SomeoneFilmCamera - a recording rig for the film, not part of the Lens.
 *
 * After the Lens has placed the rescue space, it takes the camera off device
 * tracking, cuts to a wide shot across the plaza, holds, then walks in and
 * kneels along one eased path, updated every frame so the move is smooth.
 * When done it hands the camera back to tracking (the kneel pose matches the
 * preview pose, so there is no jump). Keep the object disabled unless filming.
 *
 * Coordinates are world space, the same as the Preview camera / Inspector.
 */
@component
export class SomeoneFilmCamera extends BaseScriptComponent {
  @input
  @hint("The scene camera (Camera Object).")
  cameraObject: SceneObject

  @input
  @hint("Seconds after start before the cut to the wide shot (lets the Lens place the space).")
  startDelay: number = 2.5

  @input
  @hint("Seconds to hold the wide shot.")
  holdWide: number = 3.0

  @input
  @hint("Seconds for the walk in.")
  walkSeconds: number = 6.0

  @input
  @hint("Seconds to kneel.")
  kneelSeconds: number = 2.2

  @input wideEye: vec3 = new vec3(44, 5, 470)
  @input wideLook: vec3 = new vec3(44, -160, -85)
  @input standEye: vec3 = new vec3(8, -5, 105)
  @input standLook: vec3 = new vec3(14, -150, -85)
  @input kneelEye: vec3 = new vec3(0, -85, 0)
  @input kneelLook: vec3 = new vec3(0, -120, -85)

  private t0 = -1
  private tracking: Component[] = []
  private done = false

  onAwake(): void {
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  private tick(): void {
    if (this.done || !this.cameraObject) return
    const now = getTime()
    if (this.t0 < 0) this.t0 = now
    const t = now - this.t0 - this.startDelay
    if (t < 0) return
    if (this.tracking.length === 0) {
      this.tracking = this.cameraObject.getComponents("Component.DeviceTracking") as Component[]
      for (const c of this.tracking) c.enabled = false
    }
    let eye: vec3
    let look: vec3
    const w = t - this.holdWide
    if (w < 0) {
      eye = this.wideEye
      look = this.wideLook
    } else if (w < this.walkSeconds) {
      const s = SomeoneFilmCamera.ease(w / this.walkSeconds)
      eye = vec3.lerp(this.wideEye, this.standEye, s)
      look = vec3.lerp(this.wideLook, this.standLook, s)
    } else if (w < this.walkSeconds + this.kneelSeconds) {
      const s = SomeoneFilmCamera.ease((w - this.walkSeconds) / this.kneelSeconds)
      eye = vec3.lerp(this.standEye, this.kneelEye, s)
      look = vec3.lerp(this.standLook, this.kneelLook, s)
    } else {
      for (const c of this.tracking) c.enabled = true
      this.done = true
      return
    }
    const tr = this.cameraObject.getTransform()
    tr.setWorldPosition(eye)
    // A camera looks down its -Z, so +Z points from the target back to the eye.
    tr.setWorldRotation(quat.lookAt(eye.sub(look).normalize(), vec3.up()))
  }

  private static ease(x: number): number {
    const c = Math.min(1, Math.max(0, x))
    return c * c * (3 - 2 * c)
  }
}
