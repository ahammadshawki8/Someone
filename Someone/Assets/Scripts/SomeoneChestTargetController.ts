/**
 * SomeoneChestTargetController - the glowing hand-placement target on the
 * figure's sternum. Stand-in for "the glasses found the chest".
 *
 * Lives on the authored ChestTarget SceneObject (unit scale, identity
 * rotation wrapper). Its authored children are the visuals (coral disc and
 * center dot). This script adds the box collider + SIK Interactable to the
 * wrapper itself, so one compression = one pinch (one click in preview).
 *
 * Events: onPinch (each accepted pinch while shown)
 * API:    setShown(on), pressFeedback(), setHandsOn(on)
 * Getters: isShown, isHovered, isHandsOn
 *
 * Must not: count compressions or grade rate (state machine owns that).
 */
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {SomeoneTweens} from "./SomeoneTween"
import {SomeoneVisualFade} from "./SomeoneVisualFade"

@component
export class SomeoneChestTargetController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneChestTargetController - pinch target on the chest</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Visual root under this wrapper (disc + dot). Scaled for hover, never the collider.")
  visualRoot: SceneObject
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Pinch area width and depth in cm (large target, easy to hit).")
  @widget(new SliderWidget(14, 36, 1))
  hitSizeCm: number = 24

  @input
  @hint("Seconds for the show and hide fade (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.45

  @input
  @hint("Draw the collider wireframe for hit-zone debugging.")
  debugCollider: boolean = false
  @ui.group_end

  private _onPinch = new Event<void>()
  get onPinch(): PublicApi<void> {
    return this._onPinch.publicApi()
  }

  private tweens = new SomeoneTweens()
  private fade: SomeoneVisualFade
  private collider: ColliderComponent
  private interactable: Interactable
  private shown = false
  private hovered = false
  private handsOn = false
  private alpha = 0
  private hoverBoost = 0
  private press = 0

  onAwake(): void {
    const root = this.visualRoot ? this.visualRoot : this.sceneObject
    this.fade = new SomeoneVisualFade(root)

    this.collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent
    const box = Shape.createBoxShape()
    box.size = new vec3(this.hitSizeCm, 6, this.hitSizeCm)
    this.collider.shape = box
    this.collider.fitVisual = false
    this.collider.debugDrawEnabled = this.debugCollider
    this.collider.enabled = false

    this.interactable = this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable
    this.interactable.targetingMode = 3 // direct and indirect pinch

    this.createEvent("OnStartEvent").bind(() => {
      this.interactable.onTriggerStart.add(() => {
        if (!this.shown) return
        this._onPinch.invoke()
      })
      this.interactable.onHoverEnter.add(() => this.setHover(true))
      this.interactable.onHoverExit.add(() => this.setHover(false))
    })
    this.apply()
  }

  setShown(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    this.collider.enabled = on
    if (!on) this.setHover(false)
    const from = this.alpha
    this.tweens.run("show", this.fadeSeconds, (t) => {
      this.alpha = from + ((on ? 1 : 0) - from) * t
      this.apply()
    })
  }

  /** A soft dip on each compression, eased back. No bounce. */
  pressFeedback(): void {
    this.tweens.run(
      "press",
      0.08,
      (t) => {
        this.press = t
        this.apply()
      },
      () => {
        this.tweens.run(
          "release",
          0.3,
          (t) => {
            this.press = 1 - t
            this.apply()
          },
          undefined,
          "ease-out-sine"
        )
      },
      "linear"
    )
  }

  get isShown(): boolean {
    return this.shown
  }
  get isHovered(): boolean {
    return this.hovered
  }

  /** Tracked palms are on the chest: same calm brightening as an aimed pinch. */
  setHandsOn(on: boolean): void {
    if (on === this.handsOn) return
    this.handsOn = on
    this.updateBoost()
  }

  get isHandsOn(): boolean {
    return this.handsOn
  }

  private setHover(on: boolean): void {
    if (on === this.hovered) return
    this.hovered = on
    this.updateBoost()
  }

  private updateBoost(): void {
    const on = this.hovered || this.handsOn
    const from = this.hoverBoost
    this.tweens.run("hover", 0.3, (t) => {
      this.hoverBoost = from + ((on ? 1 : 0) - from) * t
      this.apply()
    })
  }

  private apply(): void {
    // Brighter on hover; the visual (not the collider wrapper) scales.
    // It blooms open as it fades in (0.82 to 1), and closes as it fades out.
    const a = this.alpha * (0.75 + 0.25 * this.hoverBoost)
    this.fade.setAlpha(a)
    if (this.visualRoot) {
      const bloom = 0.82 + 0.18 * this.alpha
      const s = bloom * (1 + 0.06 * this.hoverBoost - 0.05 * this.press)
      this.visualRoot.getTransform().setLocalScale(new vec3(s, s, s))
    }
  }
}
