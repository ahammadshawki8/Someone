/**
 * SomeoneClockChipUI - small "time since collapse" chip, low beside the
 * figure's shoulder. Peripheral status, never in the center.
 *
 * A passive view. API: setTime(seconds), setChipVisible(on).
 * Getters: currentTimeText, isChipShown. Must not: run its own clock.
 */
import {FlexAlign} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {CLOCK_CAPTION} from "./SomeoneConfig"
import {makeColumn, makeTextItem, setTextAlpha, SomeoneTweens} from "./SomeoneSharedUI"

@component
export class SomeoneClockChipUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneClockChipUI - time since collapse</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input("vec4", "{0.969,0.961,0.949,0.85}")
  @hint("Chip text color (warm white, slightly dimmed so it stays peripheral).")
  @widget(new ColorWidget())
  textColor: vec4

  @input
  @hint("Seconds for the show and hide fade (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.45
  @ui.group_end

  private tweens = new SomeoneTweens()
  private timeText: Text
  private captionText: Text
  private captionColor: vec4
  private alpha = 0
  private shown = false
  private timeString = "0:00"

  onAwake(): void {
    if (!this.textColor) this.textColor = new vec4(0.969, 0.961, 0.949, 0.85)
    this.captionColor = new vec4(this.textColor.x, this.textColor.y, this.textColor.z, this.textColor.w * 0.7)
    this.sceneObject.createComponent("Component.Canvas")
    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    const col = makeColumn(content, "ChipColumn", 12, {gap: 0.2, align: FlexAlign.Center})
    this.timeText = makeTextItem(col.so, col.flex, "Time", "0:00", "Value", 12, 3.0, {color: this.textColor})
    this.captionText = makeTextItem(col.so, col.flex, "Since", CLOCK_CAPTION, "Caption", 12, 1.6, {
      color: this.captionColor
    })
    this.apply()
  }

  setTime(seconds: number): void {
    const s = Math.max(0, Math.floor(seconds))
    const m = Math.floor(s / 60)
    const r = s % 60
    const str = m + ":" + (r < 10 ? "0" : "") + r
    if (str !== this.timeString) {
      this.timeString = str
      if (this.timeText) this.timeText.text = str
    }
  }

  setChipVisible(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    const from = this.alpha
    this.tweens.run("chip", this.fadeSeconds, (t) => {
      this.alpha = from + ((on ? 1 : 0) - from) * t
      this.apply()
    })
  }

  get currentTimeText(): string {
    return this.timeString
  }
  get isChipShown(): boolean {
    return this.shown
  }

  private apply(): void {
    if (this.timeText) setTextAlpha(this.timeText, this.textColor, this.alpha)
    if (this.captionText) setTextAlpha(this.captionText, this.captionColor, this.alpha)
  }
}
