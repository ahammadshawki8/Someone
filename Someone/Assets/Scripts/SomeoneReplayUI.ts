/**
 * SomeoneReplayUI - the calm replay at the very end, in the card's spot,
 * slightly larger. Four stat rows, then "You did not freeze."
 *
 * A passive view. No panel (additive display). Starts hidden.
 * API (Main -> UI):   showReplay(stats), hideReplay()
 * Events (UI -> Main): onRestart (the "Start over" button)
 * Test getters: isReplayShown, shownTotal, shownOnPacePercent,
 *               shownLongestStreak, shownTimeToFirst, closingLine
 * Must not: compute stats.
 */
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {REPLAY_CLOSING} from "./SomeoneConfig"
import {StatsSnapshot} from "./SomeoneSessionStats"
import {makeCapsuleButton, makeColumn, makeRow, makeTextItem, setTextAlpha, SomeoneTweens} from "./SomeoneSharedUI"

@component
export class SomeoneReplayUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneReplayUI - end-of-rescue replay</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Replay width in cm (slightly larger than the instruction card).")
  @widget(new SliderWidget(24, 48, 1))
  replayWidthCm: number = 38

  @input("vec4", "{0.969,0.961,0.949,1}")
  @hint("Text color (warm white #F7F5F2).")
  @widget(new ColorWidget())
  textColor: vec4

  @input("vec4", "{0.361,0.949,0.71,1}")
  @hint("Accent for the on-pace value and closing line (mint #5CF2B5).")
  @widget(new ColorWidget())
  accentColor: vec4

  @input
  @hint("Seconds for the reveal fade (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.5
  @ui.group_end

  private _onRestart = new Event<void>()
  get onRestart(): PublicApi<void> {
    return this._onRestart.publicApi()
  }

  private _onPractice = new Event<void>()
  get onPractice(): PublicApi<void> {
    return this._onPractice.publicApi()
  }

  private tweens = new SomeoneTweens()
  private labelColor: vec4
  private texts: {t: Text; color: () => vec4}[] = []
  private totalValue: Text
  private paceValue: Text
  private streakValue: Text
  private firstValue: Text
  private closing: Text
  private buttonSo: SceneObject
  private button: Button
  private buttonLabel: Text
  private buttonReady = false
  private practiceBtnSo: SceneObject
  private practiceBtn: Button
  private practiceBtnLabel: Text
  private practiceBtnReady = false
  private alpha = 0
  private shown = false
  private last: StatsSnapshot | null = null

  onAwake(): void {
    if (!this.textColor) this.textColor = new vec4(0.969, 0.961, 0.949, 1)
    if (!this.accentColor) this.accentColor = new vec4(0.361, 0.949, 0.71, 1)
    this.labelColor = new vec4(this.textColor.x, this.textColor.y, this.textColor.z, 0.72)

    this.sceneObject.createComponent("Component.Canvas")
    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    const W = this.replayWidthCm
    const col = makeColumn(content, "ReplayColumn", W, {gap: 0.5, align: FlexAlign.Center})

    this.totalValue = this.statRow(col.so, col.flex, "Compressions", W)
    this.paceValue = this.statRow(col.so, col.flex, "On pace", W, true)
    this.streakValue = this.statRow(col.so, col.flex, "Longest on-pace streak", W)
    this.firstValue = this.statRow(col.so, col.flex, "First compression", W)

    this.closing = makeTextItem(col.so, col.flex, "Closing", REPLAY_CLOSING, "Display", W, 5.4, {
      color: this.accentColor
    })
    this.texts.push({t: this.closing, color: () => this.accentColor})

    const rowBtns = makeRow(col.so, col.flex, "ReplayButtons", W, 4.6, FlexJustify.Center)
    const btn = makeCapsuleButton(rowBtns.so, rowBtns.flex, "StartOver", "Start over", 13, 4.4, this.textColor)
    this.buttonSo = btn.so
    this.button = btn.button
    this.buttonLabel = btn.label
    this.texts.push({t: this.buttonLabel, color: () => this.textColor})
    this.button.onInitialized.add(() => {
      this.buttonReady = true
      this.buttonSo.enabled = this.shown
      this.apply()
    })
    this.button.onTriggerUp.add(() => {
      if (this.shown && this.alpha > 0.5) this._onRestart.invoke()
    })

    const prac = makeCapsuleButton(rowBtns.so, rowBtns.flex, "PracticeCPR", "Practice CPR", 15, 4.4, this.accentColor)
    this.practiceBtnSo = prac.so
    this.practiceBtn = prac.button
    this.practiceBtnLabel = prac.label
    this.texts.push({t: this.practiceBtnLabel, color: () => this.accentColor})
    this.practiceBtn.onInitialized.add(() => {
      this.practiceBtnReady = true
      this.practiceBtnSo.enabled = this.shown
      this.apply()
    })
    this.practiceBtn.onTriggerUp.add(() => {
      if (this.shown && this.alpha > 0.5) this._onPractice.invoke()
    })
    this.apply()
  }

  private statRow(parent: SceneObject, parentFlex: FlexLayout, label: string, W: number, accent = false): Text {
    const row = makeRow(parent, parentFlex, "Row" + label.replace(/ /g, ""), W, 3.6, FlexJustify.SpaceBetween)
    const l = makeTextItem(row.so, row.flex, "Label", label, "Label", W * 0.66, 3.0, {
      color: this.labelColor,
      align: HorizontalAlignment.Left
    })
    const v = makeTextItem(row.so, row.flex, "Value", "0", "Value", W * 0.3, 3.0, {
      color: accent ? this.accentColor : this.textColor,
      align: HorizontalAlignment.Right
    })
    this.texts.push({t: l, color: () => this.labelColor})
    this.texts.push({t: v, color: () => (accent ? this.accentColor : this.textColor)})
    return v
  }

  showReplay(stats: StatsSnapshot): void {
    this.last = stats
    this.totalValue.text = "" + stats.totalCompressions
    this.paceValue.text = stats.onPacePercent + "%"
    this.streakValue.text = "" + stats.longestStreak
    this.firstValue.text = stats.timeToFirstSec >= 0 ? SomeoneReplayUI.fmt(stats.timeToFirstSec) : "-"
    this.setShown(true)
  }

  hideReplay(): void {
    this.setShown(false)
  }

  get isReplayShown(): boolean {
    return this.shown
  }
  get shownTotal(): number {
    return this.last ? this.last.totalCompressions : -1
  }
  get shownOnPacePercent(): number {
    return this.last ? this.last.onPacePercent : -1
  }
  get shownLongestStreak(): number {
    return this.last ? this.last.longestStreak : -1
  }
  get shownTimeToFirst(): number {
    return this.last ? this.last.timeToFirstSec : -1
  }
  get closingLine(): string {
    return REPLAY_CLOSING
  }

  private setShown(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    if (on && this.buttonReady) this.buttonSo.enabled = true
    const from = this.alpha
    this.tweens.run(
      "replay",
      this.fadeSeconds,
      (t) => {
        this.alpha = from + ((on ? 1 : 0) - from) * t
        this.apply()
      },
      () => {
        if (!on && this.buttonReady) this.buttonSo.enabled = false
      }
    )
  }

  private apply(): void {
    for (const e of this.texts) setTextAlpha(e.t, e.color(), this.alpha)
    if (this.buttonReady) this.button.opacity = this.alpha
  }

  private static fmt(sec: number): string {
    const s = Math.max(0, Math.round(sec))
    const m = Math.floor(s / 60)
    const r = s % 60
    return m + ":" + (r < 10 ? "0" : "") + r
  }
}
