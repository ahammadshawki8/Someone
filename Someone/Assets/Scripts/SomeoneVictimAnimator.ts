/**
 * SomeoneVictimAnimator - dynamic anatomical animation and responsiveness
 * for the patient/victim figure in the rescue scene.
 *
 * Supports both high-fidelity rigged anatomical body mesh (Body_Mesh_With_Skeleton)
 * and legacy stand-in figure:
 *   1. Breathing motion in "Collapse" state (shallow/agonal respiratory movement).
 *   2. Realistic 4-5 cm chest deflection and elastic recoil on each CPR compression.
 *   3. Open-airway head tilt posture during compression phases.
 *   4. Signs of life (ROSC recovery gasp) on successful rescue / paramedic arrival.
 *   5. "Real Victim Mode": cleanly hides the 3D dummy mesh when filming with
 *      a real human actor, letting AR guides overlay directly onto the real person.
 */
import {SomeoneTweens} from "./SomeoneTween"

@component
export class SomeoneVictimAnimator extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneVictimAnimator - responsive victim physics</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Compression deflection depth in cm (AHA guidelines: 4 to 5 cm).")
  @widget(new SliderWidget(2, 6, 0.5))
  compressionDepthCm: number = 4.5

  @input
  @hint("Whether the 3D dummy mesh is visible. Disable for Real Victim Mode.")
  dummyVisible: boolean = true
  @ui.group_end

  private tweens = new SomeoneTweens()
  private figureRoot: SceneObject | null = null
  private torso: SceneObject | null = null
  private head: SceneObject | null = null
  private basePos: vec3 = new vec3(87, 8, 0)
  private headBaseRot: quat = quat.quatIdentity()
  private isBreathing: boolean = false
  private breathingTimer: number = 0
  private compressionOffset: number = 0
  private headNodOffset: number = 0

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.initFigure())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private initFigure(): void {
    this.figureRoot =
      this.findChild(this.sceneObject, "Body_Mesh_With_Skeleton_A_Pose") ||
      this.findChild(this.sceneObject, "VictimFigure_StandIn")

    if (this.figureRoot) {
      this.torso = this.findChild(this.figureRoot, "Torso")
      this.head = this.findChild(this.figureRoot, "Character1_Head") || this.findChild(this.figureRoot, "Head")

      this.basePos = this.figureRoot.getTransform().getLocalPosition()

      if (this.head) {
        this.headBaseRot = this.head.getTransform().getLocalRotation()
      }
      this.applyDummyVisibility()
    }
  }

  private findChild(parent: SceneObject, name: string): SceneObject | null {
    for (let i = 0; i < parent.getChildrenCount(); i++) {
      const c = parent.getChild(i)
      if (c.name === name) return c
      const sub = this.findChild(c, name)
      if (sub) return sub
    }
    return null
  }

  /** Trigger 4-5 cm anatomical chest compression deflection & elastic recoil. */
  compress(): void {
    const depth = this.compressionDepthCm
    this.tweens.run(
      "compress_down",
      0.06,
      (t) => {
        this.compressionOffset = -depth * t
        this.headNodOffset = 2.0 * t
      },
      () => {
        this.tweens.run(
          "compress_recoil",
          0.14,
          (t) => {
            this.compressionOffset = -depth * (1 - t)
            this.headNodOffset = 2.0 * (1 - t)
          },
          undefined,
          "ease-out-sine"
        )
      },
      "ease-in-sine"
    )
  }

  /** Activate or deactivate breathing movement during the Check state. */
  setBreathing(active: boolean): void {
    this.isBreathing = active
    if (!active) {
      this.breathingTimer = 0
    }
  }

  /** Tilt head backward for open airway resuscitation posture. */
  setAirwayOpen(open: boolean): void {
    if (!this.head) return
    const targetDeg = open ? -22 : -14
    const currentEuler = this.head.getTransform().getLocalRotation().toEulerAngles()
    const fromDeg = currentEuler.z * (180 / Math.PI)
    this.tweens.run(
      "airway_tilt",
      0.5,
      (t) => {
        if (!this.head) return
        const angle = fromDeg + (targetDeg - fromDeg) * t
        this.head.getTransform().setLocalRotation(quat.fromEulerVec(new vec3(0, 0, angle * (Math.PI / 180))))
      },
      undefined,
      "ease-out-sine"
    )
  }

  /** Signs of life recovery gasp (ROSC) when CPR succeeds / Help arrives. */
  triggerRecoveryGasp(): void {
    this.tweens.run(
      "recovery_gasp",
      0.8,
      (t) => {
        // Deep inhalation (+2.0 cm)
        this.compressionOffset = 2.0 * Math.sin(t * Math.PI)
        this.headNodOffset = -3.0 * Math.sin(t * Math.PI)
      },
      () => {
        this.compressionOffset = 0
        this.headNodOffset = 0
        // Settle into gentle normal breathing
        this.setBreathing(true)
      },
      "ease-out-sine"
    )
  }

  /** Toggle 3D dummy mesh visibility (Real Victim Mode). */
  setDummyVisible(visible: boolean): void {
    this.dummyVisible = visible
    this.applyDummyVisibility()
  }

  private applyDummyVisibility(): void {
    if (!this.figureRoot) return
    const setVisualsEnabled = (so: SceneObject, en: boolean) => {
      const rmv = so.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
      if (rmv) rmv.enabled = en
      for (let i = 0; i < so.getChildrenCount(); i++) {
        setVisualsEnabled(so.getChild(i), en)
      }
    }
    setVisualsEnabled(this.figureRoot, this.dummyVisible)
  }

  private onUpdate(): void {
    const dt = getDeltaTime()
    let breathingY = 0

    if (this.isBreathing) {
      this.breathingTimer += dt * 1.6
      // Subtle 0.7 cm sinusoidal chest heave
      breathingY = Math.sin(this.breathingTimer) * 0.7
    }

    if (this.figureRoot) {
      const totalY = this.basePos.y + this.compressionOffset + breathingY
      const current = this.figureRoot.getTransform().getLocalPosition()
      this.figureRoot.getTransform().setLocalPosition(new vec3(current.x, totalY, current.z))
    }

    if (this.head && this.headNodOffset !== 0) {
      const currentRot = this.head.getTransform().getLocalRotation()
      const euler = currentRot.toEulerAngles()
      const nodRad = this.headNodOffset * (Math.PI / 180)
      this.head.getTransform().setLocalRotation(quat.fromEulerVec(new vec3(euler.x + nodRad, euler.y, euler.z)))
    }
  }
}
