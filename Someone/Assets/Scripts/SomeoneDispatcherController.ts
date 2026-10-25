/**
 * SomeoneDispatcherController - the scripted 911 dispatcher (stand-in).
 *
 * No real call, no real video share. Each cue from the state machine shows
 * a calm caption line for a few seconds (captions are always on). If a
 * voice clip is assigned for that cue, it plays too. The clip slots are left
 * empty for a future recording; captions alone carry the dispatcher today.
 *
 * Voice clip order (index -> cue): 0 connected, 1 placeHands,
 * 2 firstCompression, 3 aedPrompt, 4 sent, 5 swap, 6 aedArrives,
 * 7 standClear, 8 afterShock, 9 helpArrives.
 *
 * API: say(cue), clear()   Events: onCaption(text, "" clears)
 * Getters: currentCaption, linesSpoken
 * Must not: decide when cues happen.
 */
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {CAPTION_HOLD_SEC, DISPATCHER_LINES, DispatcherCue} from "./SomeoneConfig"

const CUE_ORDER: DispatcherCue[] = [
  "connected",
  "placeHands",
  "firstCompression",
  "aedPrompt",
  "sent",
  "swap",
  "aedArrives",
  "standClear",
  "afterShock",
  "helpArrives"
]

@component
export class SomeoneDispatcherController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneDispatcherController - scripted dispatcher + captions</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @allowUndefined
  @hint("Optional recorded dispatcher lines, in cue order (see script header). Leave empty for captions only.")
  voiceClips: AudioTrackAsset[] = []
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Seconds each caption stays when nothing else is waiting.")
  @widget(new SliderWidget(3, 10, 0.5))
  captionHoldSeconds: number = CAPTION_HOLD_SEC

  @input
  @hint("Dispatcher voice volume (when clips are assigned).")
  @widget(new SliderWidget(0, 1, 0.05))
  voiceVolume: number = 0.9
  @ui.group_end

  private _onCaption = new Event<string>()
  get onCaption(): PublicApi<string> {
    return this._onCaption.publicApi()
  }

  private queue: DispatcherCue[] = []
  private current = ""
  private holdLeft = -1
  private spoken = 0
  private audio: AudioComponent

  onAwake(): void {
    this.audio = this.sceneObject.createComponent("Component.AudioComponent") as AudioComponent
    this.audio.volume = this.voiceVolume
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  say(cue: DispatcherCue): void {
    this.queue.push(cue)
    // A newer line shortens the current one so the dispatcher keeps up.
    if (this.holdLeft > 2.5) this.holdLeft = 2.5
    if (this.holdLeft < 0) this.next()
  }

  clear(): void {
    this.queue = []
    this.holdLeft = -1
    this.setCaption("")
  }

  get currentCaption(): string {
    return this.current
  }
  get linesSpoken(): number {
    return this.spoken
  }

  private onUpdate(): void {
    if (this.holdLeft < 0) return
    this.holdLeft -= getDeltaTime()
    if (this.holdLeft >= 0) return
    if (this.queue.length > 0) {
      this.next()
    } else {
      this.holdLeft = -1
      this.setCaption("")
    }
  }

  private next(): void {
    const cue = this.queue.shift()
    if (!cue) return
    this.spoken++
    this.setCaption(DISPATCHER_LINES[cue])
    this.holdLeft = this.queue.length > 0 ? 3.5 : this.captionHoldSeconds
    const idx = CUE_ORDER.indexOf(cue)
    const clip = this.voiceClips && idx >= 0 && idx < this.voiceClips.length ? this.voiceClips[idx] : null
    if (clip) {
      if (this.audio.isPlaying()) this.audio.stop(true)
      this.audio.audioTrack = clip
      this.audio.play(1)
    }
  }

  private setCaption(text: string): void {
    if (text === this.current) return
    this.current = text
    this._onCaption.invoke(text)
  }
}
