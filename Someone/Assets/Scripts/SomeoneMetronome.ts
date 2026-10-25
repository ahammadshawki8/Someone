/**
 * SomeoneMetronome - the spatial beat that comes from the chest.
 *
 * Lives on the authored Metronome SceneObject at the chest, so the rhythm
 * comes from where the hands are. Plays a soft warm beat at the guide tempo
 * (110 per minute) while running, and fires onBeat so the ring pulses in
 * sync. Spatial audio (position + distance) is enabled on the source.
 *
 * API: startBeat(), stopBeat()   Events: onBeat   Getters: isRunning, beatCount
 * Must not: grade the user's rate.
 */
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {RATE} from "./SomeoneConfig"

@component
export class SomeoneMetronome extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneMetronome - spatial beat at the chest</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("The beat sound (soft, warm, short).")
  beatSound: AudioTrackAsset
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Guide tempo in beats per minute (published guidance: 100 to 120).")
  @widget(new SliderWidget(100, 120, 1))
  bpm: number = RATE.guideBpm

  @input
  @hint("Beat volume.")
  @widget(new SliderWidget(0, 1, 0.05))
  volume: number = 0.7
  @ui.group_end

  private _onBeat = new Event<void>()
  get onBeat(): PublicApi<void> {
    return this._onBeat.publicApi()
  }

  private audio: AudioComponent
  private running = false
  private untilNext = 0
  private beats = 0

  onAwake(): void {
    this.audio = this.sceneObject.createComponent("Component.AudioComponent") as AudioComponent
    if (this.beatSound) this.audio.audioTrack = this.beatSound
    this.audio.volume = this.volume
    this.createEvent("OnStartEvent").bind(() => {
      this.audio.playbackMode = Audio.PlaybackMode.LowLatency
      const sa = this.audio.spatialAudio
      if (sa) {
        sa.enabled = true
        sa.positionEffect.enabled = true
        sa.distanceEffect.enabled = true
        sa.distanceEffect.minDistance = 50
        sa.distanceEffect.maxDistance = 600
      }
    })
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  startBeat(): void {
    if (this.running) return
    this.running = true
    this.untilNext = 0 // first beat right away
  }

  stopBeat(): void {
    this.running = false
  }

  get isRunning(): boolean {
    return this.running
  }
  get beatCount(): number {
    return this.beats
  }

  private onUpdate(): void {
    if (!this.running) return
    this.untilNext -= getDeltaTime()
    if (this.untilNext > 0) return
    this.untilNext += 60 / Math.max(1, this.bpm)
    if (this.untilNext < 0) this.untilNext = 60 / Math.max(1, this.bpm)
    this.beats++
    if (this.audio.audioTrack) {
      if (this.audio.isPlaying()) this.audio.stop(false)
      this.audio.play(1)
    }
    this._onBeat.invoke()
  }
}
