/**
 * SomeoneInstructionCardUI - the one instruction card.
 *
 * A passive view. Light warm-white text on NO panel (additive display: dark
 * panels are banned by the design direction). Column, top to bottom:
 *   dispatcher badge (mint, top edge) / one large line / caption line /
 *   one big capsule button (UIKit Button, at least 8 cm wide).
 *
 * API (Main -> UI):  showStep(line, buttonLabel, action), setCaption(text),
 *                    setBadgeVisible(on), setCardVisible(on)
 * Events (UI -> Main): onAction(CardAction)
 * Test getters: isCardShown, currentLine, currentButtonLabel, currentCaption,
 *               isBadgeShown
 *
 * Every change is a slow fade (300 to 500 ms). Never a pop.
 * Must not: decide flow, hold domain state.
 */
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {BADGE_COPY, CardAction} from "./SomeoneConfig"
import {makeCapsuleButton, makeColumn, makeTextItem, setTextAlpha, SomeoneTweens} from "./SomeoneSharedUI"

@component
export class SomeoneInstructionCardUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneInstructionCardUI - the one instruction card</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Card width in cm. Long lines wrap inside it.")
  @widget(new SliderWidget(20, 44, 1))
  cardWidthCm: number = 34

  @input
  @hint("Text size of the one instruction line (em-square units, 120 is about 2.7 cm).")
  @widget(new SliderWidget(70, 160, 1))
  instructionTextSize: number = 120

  @input
  @hint("Width of the step button in cm (8 cm minimum for an easy pinch).")
  @widget(new SliderWidget(8, 24, 0.5))
  buttonWidthCm: number = 16

  @input("vec4", "{0.969,0.961,0.949,1}")
  @hint("Instruction and button text color (warm white #F7F5F2).")
  @widget(new ColorWidget())
  textColor: vec4

  @input("vec4", "{0.361,0.949,0.71,1}")
  @hint("Dispatcher badge color (mint #5CF2B5).")
  @widget(new ColorWidget())
  badgeColor: vec4

  @input
  @hint("Seconds for each fade (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.4
  @ui.group_end

  private _onAction = new Event<CardAction>()
  get onAction(): PublicApi<CardAction> {
    return this._onAction.publicApi()
  }

  private tweens = new SomeoneTweens()
  private badgeText: Text
  private lineText: Text
  private captionText: Text
  private buttonSo: SceneObject
  private button: Button
  private buttonLabel: Text
  private captionColor: vec4

  private cardAlpha = 0
  private lineAlpha = 1
  private captionAlpha = 0
  private badgeAlpha = 0
  private buttonAlpha = 0

  private shown = false
  private badgeShown = false
  private line = ""
  private buttonText: string | null = null
  private caption = ""
  private action: CardAction | null = null
  private buttonReady = false

  onAwake(): void {
    if (!this.textColor) this.textColor = new vec4(0.969, 0.961, 0.949, 1)
    if (!this.badgeColor) this.badgeColor = new vec4(0.361, 0.949, 0.71, 1)
    this.captionColor = new vec4(this.textColor.x, this.textColor.y, this.textColor.z, 0.78)
    this.build()
  }

  private build(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    const W = this.cardWidthCm
    const col = makeColumn(content, "CardColumn", W, {gap: 0.6, pad: 0, align: FlexAlign.Center})
    const flex: FlexLayout = col.flex

    this.badgeText = makeTextItem(col.so, flex, "Badge", BADGE_COPY, "Label", W, 2.2, {color: this.badgeColor})
    this.lineText = makeTextItem(col.so, flex, "Line", "", "Instruction", W, 7.6, {
      wrap: true,
      color: this.textColor,
      sizeOverride: this.instructionTextSize
    })
    this.captionText = makeTextItem(col.so, flex, "Caption", "", "Body", W, 3.6, {
      wrap: true,
      color: this.captionColor
    })
    const btn = makeCapsuleButton(col.so, flex, "StepButton", "I see someone", this.buttonWidthCm, 4.6, this.textColor)
    this.buttonSo = btn.so
    this.button = btn.button
    this.buttonLabel = btn.label

    this.button.onInitialized.add(() => {
      this.buttonReady = true
      this.applyAlphas()
      this.buttonSo.enabled = this.shown && this.buttonText !== null
    })
    this.button.onTriggerUp.add(() => {
      if (!this.shown || this.action === null || this.buttonAlpha < 0.5) return
      this._onAction.invoke(this.action)
    })
    this.applyAlphas()
  }

  // ---- API -------------------------------------------------------------------
  /** Replace the step with a slow crossfade. buttonLabel null = no button. */
  showStep(line: string, buttonLabel: string | null, action: CardAction | null): void {
    const sameLine = line === this.line
    const sameButton = buttonLabel === this.buttonText
    this.action = action
    if (sameLine && sameButton && this.shown) return
    const half = this.fadeSeconds * 0.5
    const startLine = this.lineAlpha
    const startBtn = this.buttonAlpha
    this.tweens.run(
      "step",
      this.shown && this.line !== "" ? half : 0,
      (t) => {
        if (!sameLine) this.lineAlpha = startLine * (1 - t)
        if (!sameButton) this.buttonAlpha = startBtn * (1 - t)
        this.applyAlphas()
      },
      () => {
        this.line = line
        this.lineText.text = line
        if (!sameButton) {
          this.buttonText = buttonLabel
          if (buttonLabel !== null) this.buttonLabel.text = buttonLabel
          if (this.buttonReady) this.buttonSo.enabled = buttonLabel !== null
        }
        const fromLine = this.lineAlpha
        const fromBtn = this.buttonAlpha
        this.tweens.run("stepIn", this.fadeSeconds, (t) => {
          this.lineAlpha = fromLine + (1 - fromLine) * t
          this.buttonAlpha = buttonLabel !== null ? fromBtn + (1 - fromBtn) * t : 0
          this.applyAlphas()
        })
      }
    )
    if (!this.shown) this.setCardVisible(true)
  }

  setCaption(text: string): void {
    if (text === this.caption) return
    const from = this.captionAlpha
    this.tweens.run(
      "caption",
      this.caption !== "" ? this.fadeSeconds * 0.5 : 0,
      (t) => {
        this.captionAlpha = from * (1 - t)
        this.applyAlphas()
      },
      () => {
        this.caption = text
        this.captionText.text = text
        if (text === "") return
        this.tweens.run("captionIn", this.fadeSeconds, (t) => {
          this.captionAlpha = t
          this.applyAlphas()
        })
      }
    )
  }

  setBadgeVisible(on: boolean): void {
    if (on === this.badgeShown) return
    this.badgeShown = on
    const from = this.badgeAlpha
    this.tweens.run("badge", this.fadeSeconds, (t) => {
      this.badgeAlpha = from + ((on ? 1 : 0) - from) * t
      this.applyAlphas()
    })
  }

  setCardVisible(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    const from = this.cardAlpha
    if (on && this.buttonReady) this.buttonSo.enabled = this.buttonText !== null
    this.tweens.run(
      "card",
      this.fadeSeconds,
      (t) => {
        this.cardAlpha = from + ((on ? 1 : 0) - from) * t
        this.applyAlphas()
      },
      () => {
        if (!on && this.buttonReady) this.buttonSo.enabled = false
      }
    )
  }

  // ---- Test getters ----------------------------------------------------------
  get isCardShown(): boolean {
    return this.shown
  }
  get currentLine(): string {
    return this.line
  }
  get currentButtonLabel(): string {
    return this.buttonText !== null ? this.buttonText : ""
  }
  get currentCaption(): string {
    return this.caption
  }
  get isBadgeShown(): boolean {
    return this.badgeShown
  }

  // ---- Internals -------------------------------------------------------------
  private applyAlphas(): void {
    const c = this.cardAlpha
    if (this.lineText) setTextAlpha(this.lineText, this.textColor, c * this.lineAlpha)
    if (this.captionText) setTextAlpha(this.captionText, this.captionColor, c * this.captionAlpha)
    if (this.badgeText) setTextAlpha(this.badgeText, this.badgeColor, c * this.badgeAlpha)
    if (this.buttonLabel) setTextAlpha(this.buttonLabel, this.textColor, c * this.buttonAlpha)
    if (this.button && this.buttonReady) this.button.opacity = c * this.buttonAlpha
  }
}
