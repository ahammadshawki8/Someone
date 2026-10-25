/**
 * SomeoneRateCueUI - the one-word pace cue beside the ring ("Good." /
 * "Faster." / "Slower."). Not an instruction card: it is the ring's voice.
 *
 * A passive view. API: setCue(text, color), clearCue(). Getter: currentCue.
 * Color changes ease over the fade time; text swaps crossfade. No pops.
 * Must not: compute rates or grades.
 */
import {FlexAlign} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {makeColumn, makeTextItem, setTextAlpha, SomeoneTweens} from "./SomeoneSharedUI"

@component
export class SomeoneRateCueUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneRateCueUI - pace cue beside the ring</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Cue text size (em-square units).")
  @widget(new SliderWidget(40, 120, 1))
  cueTextSize: number = 72

  @input
  @hint("Seconds for color and text fades (design range 0.3 to 0.5).")
  @widget(new SliderWidget(0.3, 0.5, 0.05))
  fadeSeconds: number = 0.3
  @ui.group_end

  private tweens = new SomeoneTweens()
  private cueText: Text
  private color = new vec4(1, 1, 1, 1)
  private alpha = 0
  private cue = ""

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    const col = makeColumn(content, "CueColumn", 16, {align: FlexAlign.Center})
    this.cueText = makeTextItem(col.so, col.flex, "Cue", "", "Value", 16, 3.4, {sizeOverride: this.cueTextSize})
    this.apply()
  }

  setCue(text: string, color: vec4): void {
    const fromColor = this.color
    if (text === this.cue) {
      // Same word: ease the color only.
      this.tweens.run("color", this.fadeSeconds, (t) => {
        this.color = vec4.lerp(fromColor, color, t)
        this.apply()
      })
      if (this.alpha < 1) this.fadeTo(1)
      return
    }
    const fromAlpha = this.alpha
    this.tweens.run(
      "swap",
      this.cue !== "" ? this.fadeSeconds * 0.5 : 0,
      (t) => {
        this.alpha = fromAlpha * (1 - t)
        this.apply()
      },
      () => {
        this.cue = text
        this.cueText.text = text
        this.color = color
        this.fadeTo(1)
      }
    )
  }

  clearCue(): void {
    if (this.cue === "") return
    const from = this.alpha
    this.tweens.cancel("alpha")
    this.tweens.run(
      "swap",
      this.fadeSeconds,
      (t) => {
        this.alpha = from * (1 - t)
        this.apply()
      },
      () => {
        this.cue = ""
        this.cueText.text = ""
        this.alpha = 0
        this.apply()
      }
    )
  }

  get currentCue(): string {
    return this.cue
  }

  private fadeTo(target: number): void {
    const from = this.alpha
    this.tweens.run("alpha", this.fadeSeconds, (t) => {
      this.alpha = from + (target - from) * t
      this.apply()
    })
  }

  private apply(): void {
    if (this.cueText) setTextAlpha(this.cueText, this.color, this.alpha)
  }
}
