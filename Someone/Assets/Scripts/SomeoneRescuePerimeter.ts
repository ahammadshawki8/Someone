/**
 * SomeoneRescuePerimeter - high-tech AR floor rescue boundary.
 *
 * Renders an emergency 360-degree perimeter around the victim on the floor:
 *   - 4 corner brackets (bracketed spatial tracking anchors)
 *   - Subtle perimeter boundary lines
 *   - Floor label: "[ RESCUE ZONE - MAINTAIN 360 CLEAR AREA ]"
 *
 * Grounded on the floor at y = 0.5 cm relative to RescueSpace.
 * Aesthetic: subtle, calm, medical-grade additive cyan/mint glow.
 */
import {PALETTE, withAlpha} from "./SomeoneConfig"
import {SomeoneTweens} from "./SomeoneTween"

const RING_MAT = requireAsset("../Materials/SomeoneRing.mat") as Material
const BOX_MESH = requireAsset("../Meshes/SomeoneBox.mesh") as RenderMesh

@component
export class SomeoneRescuePerimeter extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneRescuePerimeter - AR floor boundary</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Perimeter length along victim axis (cm).")
  @widget(new SliderWidget(160, 260, 5))
  perimeterLengthCm: number = 220

  @input
  @hint("Perimeter width across victim axis (cm).")
  @widget(new SliderWidget(80, 160, 5))
  perimeterWidthCm: number = 130

  @input
  @hint("Perimeter center X offset relative to victim (cm).")
  @widget(new SliderWidget(20, 80, 2))
  centerXOffsetCm: number = 55

  @input
  @hint("Floor clearance height in cm.")
  @widget(new SliderWidget(0.1, 2, 0.1))
  floorClearanceCm: number = 0.4
  @ui.group_end

  private tweens = new SomeoneTweens()
  private rootSo: SceneObject
  private passes: Pass[] = []
  private alpha = 0
  private labelText: Text | null = null

  onAwake(): void {
    this.rootSo = global.scene.createSceneObject("PerimeterRoot")
    this.rootSo.setParent(this.sceneObject)
    this.buildPerimeter()
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    this.fadeIn()
  }

  private buildPerimeter(): void {
    const halfL = this.perimeterLengthCm * 0.5
    const halfW = this.perimeterWidthCm * 0.5
    const cx = this.centerXOffsetCm
    const cy = this.floorClearanceCm
    const bracketArm = 18 // cm
    const barThick = 0.8 // cm
    const barHeight = 0.2 // cm

    // Corners: [minX, maxX] x [minZ, maxZ]
    const minX = cx - halfL
    const maxX = cx + halfL
    const minZ = -halfW
    const maxZ = halfW

    // 4 Corner Brackets
    // Top-Left: (minX, minZ) -> arm +X, arm +Z
    this.makeBar("TL_X", new vec3(minX + bracketArm * 0.5, cy, minZ), new vec3(bracketArm, barHeight, barThick))
    this.makeBar("TL_Z", new vec3(minX, cy, minZ + bracketArm * 0.5), new vec3(barThick, barHeight, bracketArm))

    // Top-Right: (maxX, minZ) -> arm -X, arm +Z
    this.makeBar("TR_X", new vec3(maxX - bracketArm * 0.5, cy, minZ), new vec3(bracketArm, barHeight, barThick))
    this.makeBar("TR_Z", new vec3(maxX, cy, minZ + bracketArm * 0.5), new vec3(barThick, barHeight, bracketArm))

    // Bottom-Left: (minX, maxZ) -> arm +X, arm -Z
    this.makeBar("BL_X", new vec3(minX + bracketArm * 0.5, cy, maxZ), new vec3(bracketArm, barHeight, barThick))
    this.makeBar("BL_Z", new vec3(minX, cy, maxZ - bracketArm * 0.5), new vec3(barThick, barHeight, bracketArm))

    // Bottom-Right: (maxX, maxZ) -> arm -X, arm -Z
    this.makeBar("BR_X", new vec3(maxX - bracketArm * 0.5, cy, maxZ), new vec3(bracketArm, barHeight, barThick))
    this.makeBar("BR_Z", new vec3(maxX, cy, maxZ - bracketArm * 0.5), new vec3(barThick, barHeight, bracketArm))

    // Subtle edge tick marks along center sides
    this.makeBar("SideTick_Top", new vec3(cx, cy, minZ), new vec3(8, barHeight, barThick * 0.8))
    this.makeBar("SideTick_Bottom", new vec3(cx, cy, maxZ), new vec3(8, barHeight, barThick * 0.8))

    // Floor Label: "[ RESCUE ZONE - 360 CLEAR ]"
    const labelSo = global.scene.createSceneObject("PerimeterLabel")
    labelSo.setParent(this.rootSo)
    const lt = labelSo.getTransform()
    lt.setLocalPosition(new vec3(cx, cy + 0.2, maxZ + 8))
    lt.setLocalRotation(quat.angleAxis(-Math.PI * 0.5, new vec3(1, 0, 0)))

    const textComp = labelSo.createComponent("Component.Text") as Text
    textComp.text = "[ RESCUE ZONE - 360 CLEAR AREA ]"
    textComp.size = 28
    textComp.textFill.color = withAlpha(PALETTE.warmWhite, 0.5)
    this.labelText = textComp
  }

  private makeBar(name: string, pos: vec3, size: vec3): void {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.rootSo)
    const t = so.getTransform()
    t.setLocalPosition(pos)
    t.setLocalScale(size)

    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = BOX_MESH
    const mat = RING_MAT.clone()
    mat.mainPass.baseColor = withAlpha(PALETTE.mint, 0.45)
    rmv.mainMaterial = mat
    this.passes.push(mat.mainPass)
  }

  private fadeIn(): void {
    this.tweens.run("fadeIn", 1.2, (t) => {
      this.alpha = t
      this.applyAlpha()
    })
  }

  private onUpdate(): void {
    // Gentle breathing pulse on the floor perimeter (0.35 to 0.5 alpha)
    const breath = 0.42 + 0.08 * Math.sin(getTime() * 1.5)
    for (const p of this.passes) {
      p.baseColor = new vec4(PALETTE.mint.x, PALETTE.mint.y, PALETTE.mint.z, this.alpha * breath)
    }
    if (this.labelText) {
      this.labelText.textFill.color = new vec4(PALETTE.warmWhite.x, PALETTE.warmWhite.y, PALETTE.warmWhite.z, this.alpha * 0.5)
    }
  }

  private applyAlpha(): void {
    for (const p of this.passes) {
      p.baseColor = new vec4(PALETTE.mint.x, PALETTE.mint.y, PALETTE.mint.z, this.alpha * 0.45)
    }
  }
}
