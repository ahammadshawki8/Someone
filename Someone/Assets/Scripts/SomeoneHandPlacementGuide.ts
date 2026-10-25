/**
 * SomeoneHandPlacementGuide - holographic 3D hand placement guide.
 *
 * Appears during PlaceHands directly over the victim's sternum:
 *   - Luminous bottom palm heel positioned on the lower half of the sternum
 *   - Top hand interlocked with crossed fingers
 *   - Directional hand placement guidance text: "HEEL ON CENTER - INTERLOCK FINGERS"
 *   - Gentle breathing hover
 *   - On first compression: compresses down 5 cm into the sternum, then dissolves into the pace ring.
 */
import {PALETTE, withAlpha} from "./SomeoneConfig"
import {SomeoneTweens} from "./SomeoneTween"

const RING_MAT = requireAsset("../Materials/SomeoneRing.mat") as Material
const BOX_MESH = requireAsset("../Meshes/SomeoneBox.mesh") as RenderMesh
const CAPSULE_MESH = requireAsset("../Meshes/SomeoneCapsule.mesh") as RenderMesh
const DISC_MESH = requireAsset("../Meshes/SomeoneDisc.mesh") as RenderMesh

@component
export class SomeoneHandPlacementGuide extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneHandPlacementGuide - holographic hands</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @allowUndefined
  @hint("Chest target SceneObject to anchor above.")
  chestTarget: SceneObject
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Hover height above sternum in cm.")
  @widget(new SliderWidget(6, 24, 1))
  hoverHeightCm: number = 14
  @ui.group_end

  private tweens = new SomeoneTweens()
  private rootSo: SceneObject
  private passes: Pass[] = []
  private labelText: Text | null = null
  private shown = false
  private alpha = 0
  private pressDownY = 0
  private basePos = new vec3(0, 0, 0)

  onAwake(): void {
    this.rootSo = global.scene.createSceneObject("HoloHandsRoot")
    this.rootSo.setParent(this.sceneObject)
    this.buildHands()
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    this.setShown(false, true)
  }

  private buildHands(): void {
    // Bottom Hand (Heel of palm on sternum)
    // Heel disc
    this.makePart("BottomHeel", new vec3(0, 0, 0), new vec3(7, 0.4, 6), DISC_MESH)
    // Palm body
    this.makePart("BottomPalm", new vec3(4, 0.2, 0), new vec3(7, 0.6, 7), BOX_MESH)
    // 4 Fingers extending forward (+X)
    for (let f = -2.4; f <= 2.4; f += 1.6) {
      this.makePart("BottomFinger_" + f, new vec3(9.5, 0.2, f), new vec3(5, 0.4, 0.9), CAPSULE_MESH)
    }

    // Top Hand (Interlaced across at 25-degree yaw and 1.8cm higher)
    const topOffset = new vec3(1.0, 1.8, 0.5)
    this.makePart("TopHeel", topOffset.add(new vec3(0, 0, 0)), new vec3(7.5, 0.4, 6.5), DISC_MESH)
    this.makePart("TopPalm", topOffset.add(new vec3(3.5, 0.2, 0)), new vec3(7.5, 0.6, 7.5), BOX_MESH)
    // Interlaced fingers woven down
    for (let f = -2.2; f <= 2.2; f += 1.5) {
      this.makePart("TopFinger_" + f, topOffset.add(new vec3(9.0, -0.4, f)), new vec3(5.5, 0.45, 0.95), CAPSULE_MESH)
    }

    // 3D Text Cue above hands
    const labelSo = global.scene.createSceneObject("HandsCueLabel")
    labelSo.setParent(this.rootSo)
    const lt = labelSo.getTransform()
    lt.setLocalPosition(new vec3(0, 7.5, 0))
    lt.setLocalRotation(quat.angleAxis(-Math.PI * 0.4, new vec3(1, 0, 0)))

    const textComp = labelSo.createComponent("Component.Text") as Text
    textComp.text = "HEEL ON CENTER - INTERLOCK FINGERS"
    textComp.size = 24
    textComp.textFill.color = withAlpha(PALETTE.warmWhite, 0.85)
    this.labelText = textComp
  }

  private makePart(name: string, localPos: vec3, size: vec3, mesh: RenderMesh): void {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.rootSo)
    const t = so.getTransform()
    t.setLocalPosition(localPos)
    t.setLocalScale(size)

    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = mesh
    const mat = RING_MAT.clone()
    mat.mainPass.baseColor = withAlpha(PALETTE.mint, 0.75)
    rmv.mainMaterial = mat
    this.passes.push(mat.mainPass)
  }

  setShown(on: boolean, immediate = false): void {
    if (on === this.shown && !immediate) return
    this.shown = on
    if (immediate) {
      this.alpha = on ? 1 : 0
      this.pressDownY = 0
      this.apply()
      return
    }
    const from = this.alpha
    this.tweens.run("fade", 0.4, (t) => {
      this.alpha = from + ((on ? 1 : 0) - from) * t
      this.apply()
    })
  }

  /** On first compression: compress down into sternum, then hide. */
  pressDown(onComplete?: () => void): void {
    this.tweens.run(
      "press",
      0.15,
      (t) => {
        this.pressDownY = -5.0 * t
        this.apply()
      },
      () => {
        this.setShown(false)
        if (onComplete) onComplete()
      }
    )
  }

  get isShown(): boolean {
    return this.shown
  }

  private onUpdate(): void {
    if (this.alpha <= 0.01) {
      if (this.rootSo.enabled) this.rootSo.enabled = false
      return
    }
    if (!this.rootSo.enabled) this.rootSo.enabled = true

    // Follow chestTarget position if available
    let targetPos = new vec3(12, 11, 0)
    if (this.chestTarget) {
      targetPos = this.chestTarget.getTransform().getLocalPosition()
    }
    const hoverY = targetPos.y + this.hoverHeightCm + this.pressDownY + Math.sin(getTime() * 2.8) * 0.7
    this.rootSo.getTransform().setLocalPosition(new vec3(targetPos.x, hoverY, targetPos.z))

    // Gentle pulse
    const breath = 0.7 + 0.15 * Math.sin(getTime() * 3.0)
    for (const p of this.passes) {
      p.baseColor = new vec4(PALETTE.mint.x, PALETTE.mint.y, PALETTE.mint.z, this.alpha * breath)
    }
    if (this.labelText) {
      this.labelText.textFill.color = new vec4(PALETTE.warmWhite.x, PALETTE.warmWhite.y, PALETTE.warmWhite.z, this.alpha * 0.9)
    }
  }

  private apply(): void {
    for (const p of this.passes) {
      p.baseColor = new vec4(PALETTE.mint.x, PALETTE.mint.y, PALETTE.mint.z, this.alpha * 0.75)
    }
    if (this.labelText) {
      this.labelText.textFill.color = new vec4(PALETTE.warmWhite.x, PALETTE.warmWhite.y, PALETTE.warmWhite.z, this.alpha * 0.9)
    }
  }
}
