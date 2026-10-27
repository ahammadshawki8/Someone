/**
 * SomeoneReplayUI - the calm replay at the very end, in the card's spot,
 * slightly larger. "You did not freeze." first, then the evidence: one row
 * of four big numbers with small labels, then "Start over".
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
import {
  makeCapsuleButton,
  makeColumn,
  makeColumnItem,
  makeRow,
  makeTextItem,
  setTextAlpha,
  SomeoneTweens
} from "./SomeoneSharedUI"

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

  @input
  @hint("How far below the instruction card's spot the replay sits, in cm (keeps the headline in view).")
  @widget(new SliderWidget(0, 10, 0.5))
  dropCm: number = 4
  @ui.group_end

  private _onRestart = new Event<void>()
  get onRestart(): PublicApi<void> {
    return this._onRestart.publicApi()
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
    // Sit a little lower than the card so the headline stays inside the view.
    content.getTransform().setLocalPosition(new vec3(0, -this.dropCm, 0))
    const W = this.replayWidthCm
    const col = makeColumn(content, "ReplayColumn", W, {gap: 1.4, align: FlexAlign.Center})

    // The headline first, then the evidence: one row of big numbers.
    this.closing = makeTextItem(col.so, col.flex, "Closing", REPLAY_CLOSING, "Display", W, 5.4, {
      color: this.accentColor,
      sizeOverride: 120
    })
    this.texts.push({t: this.closing, color: () => this.accentColor})

    const row = makeRow(col.so, col.flex, "StatRow", W, 7.6, FlexJustify.SpaceBetween)
    const cell = W / 4
    this.totalValue = this.statCell(row.so, row.flex, "Compressions", cell)
    this.paceValue = this.statCell(row.so, row.flex, "On pace", cell, true)
    this.streakValue = this.statCell(row.so, row.flex, "Best streak", cell)
    this.firstValue = this.statCell(row.so, row.flex, "First push", cell)

    const btn = makeCapsuleButton(col.so, col.flex, "StartOver", "Start over", 14, 4.4, this.textColor)
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
    this.apply()
  }

  /** One stat: a big number with a small label under it. */
  private statCell(parent: SceneObject, parentFlex: FlexLayout, label: string, w: number, accent = false): Text {
    const cell = makeColumnItem(parent, parentFlex, "Stat" + label.replace(/ /g, ""), w, 7.6, 0.4)
    const v = makeTextItem(cell.so, cell.flex, "Value", "0", "Value", w, 4.2, {
      color: accent ? this.accentColor : this.textColor,
      sizeOverride: 96
    })
    const l = makeTextItem(cell.so, cell.flex, "Label", label, "Label", w, 2.4, {color: this.labelColor})
    this.texts.push({t: v, color: () => (accent ? this.accentColor : this.textColor)})
    this.texts.push({t: l, color: () => this.labelColor})
    return v
  }

  showReplay(stats: StatsSnapshot): void {
    this.last = stats
    this.firstValue.text = stats.timeToFirstSec >= 0 ? SomeoneReplayUI.fmt(stats.timeToFirstSec) : "-"
    // The numbers count up as the replay settles in.
    this.tweens.run(
      "count",
      1.4,
      (t) => {
        this.totalValue.text = "" + Math.round(stats.totalCompressions * t)
        this.paceValue.text = Math.round(stats.onPacePercent * t) + "%"
        this.streakValue.text = "" + Math.round(stats.longestStreak * t)
      },
      undefined,
      "ease-out-sine"
    )
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
