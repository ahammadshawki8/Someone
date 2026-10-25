/**
 * SomeoneCompressionRipples - kinetic shockwave depth ripples on the chest.
 *
 * Spawns an expanding concentric shockwave ripple with each compression:
 *   - On-pace (good): luminous mint green ripple
 *   - Close (amber): warm amber warning ripple
 *   - Far / neutral: coral pulse ripple
 *
 * Visually confirms kinetic force transfer and depth with every compression.
 */
import {PALETTE, withAlpha} from "./SomeoneConfig"
import {RateGrade} from "./SomeoneCompressionTracker"
import {SomeoneTweens} from "./SomeoneTween"

const RING_MAT = requireAsset("../Materials/SomeoneRing.mat") as Material
const TORUS_MESH = requireAsset("../Meshes/SomeoneTorus.mesh") as RenderMesh

interface RippleSlot {
  so: SceneObject
  pass: Pass
  active: boolean
  radius: number
  alpha: number
  color: vec4
}

@component
export class SomeoneCompressionRipples extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneCompressionRipples - kinetic chest ripples</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @allowUndefined
  @hint("Anchor point (chest target) from which ripples emit.")
  chestTarget: SceneObject
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Initial ripple radius in cm.")
  @widget(new SliderWidget(6, 18, 1))
  startRadiusCm: number = 10

  @input
  @hint("Maximum expansion radius in cm.")
  @widget(new SliderWidget(24, 60, 2))
  maxRadiusCm: number = 38

  @input
  @hint("Duration of each ripple in seconds.")
  @widget(new SliderWidget(0.2, 0.6, 0.05))
  rippleDurationSec: number = 0.38
  @ui.group_end

  private tweens = new SomeoneTweens()
  private pool: RippleSlot[] = []
  private poolSize = 4
  private nextIndex = 0

  onAwake(): void {
    const root = global.scene.createSceneObject("RipplesRoot")
    root.setParent(this.sceneObject)

    for (let i = 0; i < this.poolSize; i++) {
      const so = global.scene.createSceneObject("Ripple_" + i)
      so.setParent(root)
      so.enabled = false

      const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
      rmv.mesh = TORUS_MESH
      const mat = RING_MAT.clone()
      mat.mainPass.baseColor = withAlpha(PALETTE.mint, 0)
      rmv.mainMaterial = mat

      this.pool.push({
        so,
        pass: mat.mainPass,
        active: false,
        radius: this.startRadiusCm,
        alpha: 0,
        color: PALETTE.mint
      })
    }
  }

  /** Emit a shockwave ripple with the given rate grade color. */
  emit(grade: RateGrade): void {
    const slot = this.pool[this.nextIndex]
    this.nextIndex = (this.nextIndex + 1) % this.poolSize

    const color = grade === "good" ? PALETTE.mint : grade === "amber" ? PALETTE.amber : PALETTE.coral
    slot.color = color
    slot.active = true
    slot.so.enabled = true

    // Center at chest target
    let pos = new vec3(12, 11.2, 0)
    if (this.chestTarget) {
      pos = this.chestTarget.getTransform().getLocalPosition()
      pos = new vec3(pos.x, pos.y + 0.3, pos.z)
    }
    slot.so.getTransform().setLocalPosition(pos)

    const startR = this.startRadiusCm
    const endR = this.maxRadiusCm
    const id = "rip_" + this.nextIndex

    this.tweens.run(
      id,
      this.rippleDurationSec,
      (t) => {
        const curR = startR + (endR - startR) * t
        slot.radius = curR
        slot.alpha = Math.max(0, 0.85 * (1 - t * t))
        // Torus mesh base scale is ~1cm radius, scale uniformly in X and Z, thin in Y
        slot.so.getTransform().setLocalScale(new vec3(curR, 0.4, curR))
        slot.pass.baseColor = new vec4(color.x, color.y, color.z, slot.alpha)
      },
      () => {
        slot.active = false
        slot.so.enabled = false
      },
      "ease-out-sine"
    )
  }
}
