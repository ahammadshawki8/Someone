/**
 * SomeoneAEDBeaconVisual - 3D holographic AED unit and sonar beacon in the room.
 *
 * Placed at the authored AEDBeacon position across the room:
 *   - 3D medical defibrillator unit case (red/amber emergency casing)
 *   - Medical cross emblem
 *   - Spatial distance tag: "[ AED - 40m ]" facing the user's camera
 *   - Concentric expanding sonar pulse rings matching the 4-second chime interval
 *
 * Provides a visible destination for the user and helpers to look towards.
 */
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {PALETTE, withAlpha} from "./SomeoneConfig"
import {SomeoneTweens} from "./SomeoneTween"

const RING_MAT = requireAsset("../Materials/SomeoneRing.mat") as Material
const BOX_MESH = requireAsset("../Meshes/SomeoneBox.mesh") as RenderMesh
const TORUS_MESH = requireAsset("../Meshes/SomeoneTorus.mesh") as RenderMesh

@component
export class SomeoneAEDBeaconVisual extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneAEDBeaconVisual - 3D AED in the room</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Seconds between radar sonar pulses (aligns with chime).")
  @widget(new SliderWidget(2, 8, 0.5))
  pulseIntervalSec: number = 4.0
  @ui.group_end

  private tweens = new SomeoneTweens()
  private rootSo: SceneObject
  private tagSo: SceneObject
  private tagText: Text
  private pulseRing1: SceneObject
  private pulsePass1: Pass
  private pulseRing2: SceneObject
  private pulsePass2: Pass
  private passes: Pass[] = []
  private shown = false
  private alpha = 0
  private timeUntilPulse = 0

  onAwake(): void {
    this.rootSo = global.scene.createSceneObject("AEDVisualRoot")
    this.rootSo.setParent(this.sceneObject)
    this.buildAEDModel()
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    this.setShown(false, true)
  }

  private buildAEDModel(): void {
    // AED Defibrillator Case (26 x 14 x 22 cm)
    const caseSo = global.scene.createSceneObject("AEDCase")
    caseSo.setParent(this.rootSo)
    caseSo.getTransform().setLocalPosition(new vec3(0, 7, 0))
    caseSo.getTransform().setLocalScale(new vec3(26, 14, 22))

    const caseRmv = caseSo.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    caseRmv.mesh = BOX_MESH
    const caseMat = RING_MAT.clone()
    caseMat.mainPass.baseColor = withAlpha(PALETTE.amber, 0.8)
    caseRmv.mainMaterial = caseMat
    this.passes.push(caseMat.mainPass)

    // Medical Cross (Horizontal bar)
    const crossH = global.scene.createSceneObject("CrossH")
    crossH.setParent(this.rootSo)
    crossH.getTransform().setLocalPosition(new vec3(0, 14.2, 0))
    crossH.getTransform().setLocalScale(new vec3(12, 0.4, 4))
    const hRmv = crossH.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    hRmv.mesh = BOX_MESH
    const crossMat = RING_MAT.clone()
    crossMat.mainPass.baseColor = withAlpha(PALETTE.warmWhite, 0.9)
    hRmv.mainMaterial = crossMat
    this.passes.push(crossMat.mainPass)

    // Medical Cross (Vertical bar)
    const crossV = global.scene.createSceneObject("CrossV")
    crossV.setParent(this.rootSo)
    crossV.getTransform().setLocalPosition(new vec3(0, 14.2, 0))
    crossV.getTransform().setLocalScale(new vec3(4, 0.4, 12))
    const vRmv = crossV.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    vRmv.mesh = BOX_MESH
    vRmv.mainMaterial = crossMat

    // Floating 3D Tag: "[ AED - 40m ]"
    this.tagSo = global.scene.createSceneObject("AEDTag")
    this.tagSo.setParent(this.rootSo)
    this.tagSo.getTransform().setLocalPosition(new vec3(0, 22, 0))

    const textComp = this.tagSo.createComponent("Component.Text") as Text
    textComp.text = "[ AED - 40m ]"
    textComp.size = 32
    textComp.textFill.color = withAlpha(PALETTE.amber, 0.95)
    this.tagText = textComp

    // Sonar Pulse Ring 1
    this.pulseRing1 = global.scene.createSceneObject("SonarRing1")
    this.pulseRing1.setParent(this.rootSo)
    this.pulseRing1.getTransform().setLocalPosition(new vec3(0, 7, 0))
    const rRmv1 = this.pulseRing1.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rRmv1.mesh = TORUS_MESH
    const pMat1 = RING_MAT.clone()
    pMat1.mainPass.baseColor = withAlpha(PALETTE.amber, 0)
    rRmv1.mainMaterial = pMat1
    this.pulsePass1 = pMat1.mainPass

    // Sonar Pulse Ring 2
    this.pulseRing2 = global.scene.createSceneObject("SonarRing2")
    this.pulseRing2.setParent(this.rootSo)
    this.pulseRing2.getTransform().setLocalPosition(new vec3(0, 7, 0))
    const rRmv2 = this.pulseRing2.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rRmv2.mesh = TORUS_MESH
    const pMat2 = RING_MAT.clone()
    pMat2.mainPass.baseColor = withAlpha(PALETTE.amber, 0)
    rRmv2.mainMaterial = pMat2
    this.pulsePass2 = pMat2.mainPass
  }

  setShown(on: boolean, immediate = false): void {
    if (on === this.shown && !immediate) return
    this.shown = on
    if (immediate) {
      this.alpha = on ? 1 : 0
      this.apply()
      return
    }
    const from = this.alpha
    this.tweens.run("fade", 0.45, (t) => {
      this.alpha = from + ((on ? 1 : 0) - from) * t
      this.apply()
    })
  }

  private onUpdate(): void {
    if (this.alpha <= 0.01) {
      if (this.rootSo.enabled) this.rootSo.enabled = false
      return
    }
    if (!this.rootSo.enabled) this.rootSo.enabled = true

    // Billboard Tag towards user's camera
    const camPos = WorldCameraFinderProvider.getInstance().getTransform().getWorldPosition()
    const myPos = this.tagSo.getTransform().getWorldPosition()
    const dir = camPos.sub(myPos).normalize()
    this.tagSo.getTransform().setWorldRotation(quat.lookAt(dir, vec3.up()))

    // Sonar Radar Pulse
    this.timeUntilPulse -= getDeltaTime()
    if (this.timeUntilPulse <= 0) {
      this.timeUntilPulse = this.pulseIntervalSec
      this.triggerSonar()
    }
  }

  private triggerSonar(): void {
    this.tweens.run("sonar1", 1.8, (t) => {
      const scale = 20 + 80 * t
      this.pulseRing1.getTransform().setLocalScale(new vec3(scale, 0.5, scale))
      this.pulsePass1.baseColor = withAlpha(PALETTE.amber, this.alpha * 0.7 * (1 - t))
    })

    this.tweens.run("sonar2", 1.8, (t) => {
      const tDelayed = Math.max(0, (t - 0.25) / 0.75)
      const scale = 20 + 80 * tDelayed
      this.pulseRing2.getTransform().setLocalScale(new vec3(scale, 0.5, scale))
      this.pulsePass2.baseColor = withAlpha(PALETTE.amber, this.alpha * 0.5 * (1 - tDelayed))
    })
  }

  private apply(): void {
    for (const p of this.passes) {
      p.baseColor = withAlpha(p.baseColor, this.alpha * 0.85)
    }
    if (this.tagText) {
      this.tagText.textFill.color = withAlpha(PALETTE.amber, this.alpha * 0.95)
    }
  }
}
