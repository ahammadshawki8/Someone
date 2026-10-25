/**
 * SomeoneSternumLandmark - anatomical alignment crosshair on the sternum.
 *
 * Positioned on the lower half of the sternum directly beneath the ChestTarget:
 *   - Central anatomical alignment reticle
 *   - 4 cardinal direction tick marks (indicating the lower third compression site)
 *   - Subtle concentric target ring
 *   - Soft medical-grade mint glow
 *
 * Gives the victim's chest clear anatomical fidelity even before CPR begins.
 */
import {PALETTE, withAlpha} from "./SomeoneConfig"
import {SomeoneTweens} from "./SomeoneTween"

const RING_MAT = requireAsset("../Materials/SomeoneRing.mat") as Material
const BOX_MESH = requireAsset("../Meshes/SomeoneBox.mesh") as RenderMesh
const DISC_MESH = requireAsset("../Meshes/SomeoneDisc.mesh") as RenderMesh

@component
export class SomeoneSternumLandmark extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneSternumLandmark - anatomical sternum reticle</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Reticle radius in cm.")
  @widget(new SliderWidget(6, 16, 1))
  reticleRadiusCm: number = 10
  @ui.group_end

  private tweens = new SomeoneTweens()
  private rootSo: SceneObject
  private passes: Pass[] = []
  private alpha = 0.55

  onAwake(): void {
    this.rootSo = global.scene.createSceneObject("SternumLandmarkRoot")
    this.rootSo.setParent(this.sceneObject)
    this.buildReticle()
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private buildReticle(): void {
    const r = this.reticleRadiusCm
    const tickLen = 3.5 // cm
    const tickThick = 0.35 // cm
    const h = 0.15 // height cm

    // Center dot
    const centerSo = global.scene.createSceneObject("CenterDot")
    centerSo.setParent(this.rootSo)
    centerSo.getTransform().setLocalPosition(new vec3(0, 0.05, 0))
    centerSo.getTransform().setLocalScale(new vec3(2.5, h, 2.5))
    const dotRmv = centerSo.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    dotRmv.mesh = DISC_MESH
    const dotMat = RING_MAT.clone()
    dotMat.mainPass.baseColor = withAlpha(PALETTE.mint, 0.45)
    dotRmv.mainMaterial = dotMat
    this.passes.push(dotMat.mainPass)

    // 4 Cardinal Ticks: +X (head-ward), -X (feet-ward), +Z (lateral right), -Z (lateral left)
    this.makeTick("Tick_Pos_X", new vec3(r - tickLen * 0.5, 0.05, 0), new vec3(tickLen, h, tickThick))
    this.makeTick("Tick_Neg_X", new vec3(-r + tickLen * 0.5, 0.05, 0), new vec3(tickLen, h, tickThick))
    this.makeTick("Tick_Pos_Z", new vec3(0, 0.05, r - tickLen * 0.5), new vec3(tickThick, h, tickLen))
    this.makeTick("Tick_Neg_Z", new vec3(0, 0.05, -r + tickLen * 0.5), new vec3(tickThick, h, tickLen))

    // Subtle alignment corner brackets at 45 degrees
    const diag = r * 0.707
    const arm = 1.6
    this.makeTick("Corner_NE_X", new vec3(diag, 0.05, diag), new vec3(arm, h, tickThick * 0.8))
    this.makeTick("Corner_NE_Z", new vec3(diag, 0.05, diag), new vec3(tickThick * 0.8, h, arm))

    this.makeTick("Corner_NW_X", new vec3(-diag, 0.05, diag), new vec3(arm, h, tickThick * 0.8))
    this.makeTick("Corner_NW_Z", new vec3(-diag, 0.05, diag), new vec3(tickThick * 0.8, h, arm))

    this.makeTick("Corner_SE_X", new vec3(diag, 0.05, -diag), new vec3(arm, h, tickThick * 0.8))
    this.makeTick("Corner_SE_Z", new vec3(diag, 0.05, -diag), new vec3(tickThick * 0.8, h, arm))

    this.makeTick("Corner_SW_X", new vec3(-diag, 0.05, -diag), new vec3(arm, h, tickThick * 0.8))
    this.makeTick("Corner_SW_Z", new vec3(-diag, 0.05, -diag), new vec3(tickThick * 0.8, h, arm))
  }

  private makeTick(name: string, pos: vec3, size: vec3): void {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.rootSo)
    const t = so.getTransform()
    t.setLocalPosition(pos)
    t.setLocalScale(size)

    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = BOX_MESH
    const mat = RING_MAT.clone()
    mat.mainPass.baseColor = withAlpha(PALETTE.mint, 0.38)
    rmv.mainMaterial = mat
    this.passes.push(mat.mainPass)
  }

  private onUpdate(): void {
    // Subtle breathing glow (0.35 to 0.5)
    const pulse = 0.38 + 0.08 * Math.sin(getTime() * 1.8)
    for (const p of this.passes) {
      p.baseColor = new vec4(PALETTE.mint.x, PALETTE.mint.y, PALETTE.mint.z, this.alpha * pulse)
    }
  }

  setShown(on: boolean): void {
    const from = this.alpha
    this.tweens.run("fade", 0.4, (t) => {
      this.alpha = from + ((on ? 0.55 : 0.15) - from) * t
    })
  }
}
