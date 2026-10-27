/**
 * SomeoneMain - orchestrates the Someone rescue flow.
 *
 * Owns: the SomeoneRescueStateMachine instance (single source of truth),
 * routing its events to the passive views, routing view input (card
 * buttons, chest pinches, replay restart) back into it, placing the rescue
 * space in front of the user at start, and the public test surface below.
 *
 * Expects (@input, wired by the bootstrap): the four UI modules, the chest
 * target, pace ring, metronome, AED wayfinder, AED pads, dispatcher, and the
 * RescueSpace root.
 *
 * Must not: author UI (UI modules do), grade rate (tracker does), or hold
 * flow state outside the state machine.
 *
 * Test surface (read these from LEAF / the debugger):
 *   stateName, baseStateName, overlayName, elapsedSeconds, compressionCount,
 *   gradedCompressionCount, onPaceCompressionCount, onPacePercent,
 *   longestStreak, timeToFirstCompression, currentRate, ringColorState,
 *   rateCueText, visibleCardCount, isRingVisible, isTargetVisible,
 *   isAedArrowVisible, aedChimeCount, isBadgeVisible, isClockVisible,
 *   arePadsVisible, isReplayVisible, replayTotal, replayOnPacePercent,
 *   cardLine, cardButtonLabel, cardCaption, metronomeRunning, isDemoMode.
 *   Test hooks: testAdvanceClock(seconds).
 */
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {CARD_COPY, CardAction, CUE_COPY, PALETTE, RescueStateName} from "./SomeoneConfig"
import {SomeoneAEDPadsController} from "./SomeoneAEDPadsController"
import {SomeoneAEDWayfinder} from "./SomeoneAEDWayfinder"
import {SomeoneChestTargetController} from "./SomeoneChestTargetController"
import {SomeoneClockChipUI} from "./SomeoneClockChipUI"
import {CompressionResult} from "./SomeoneCompressionTracker"
import {SomeoneDispatcherController} from "./SomeoneDispatcherController"
import {SomeoneInstructionCardUI} from "./SomeoneInstructionCardUI"
import {SomeoneMetronome} from "./SomeoneMetronome"
import {SomeonePaceRingController} from "./SomeonePaceRingController"
import {SomeoneRateCueUI} from "./SomeoneRateCueUI"
import {RescueEvent, SomeoneRescueStateMachine} from "./SomeoneRescueStateMachine"
import {SomeoneReplayUI} from "./SomeoneReplayUI"
import {SomeoneGlancePlacer} from "./SomeoneGlancePlacer"
import {SomeoneHandCompression} from "./SomeoneHandCompression"
import {SomeoneVictimReaction} from "./SomeoneVictimReaction"
import {SomeoneViewShareCue} from "./SomeoneViewShareCue"

const TAP_SOUND = requireAsset("../GeneratedSFX/SomeoneTapConfirm.wav") as AudioTrackAsset
const CONNECT_SOUND = requireAsset("../GeneratedSFX/SomeoneDispatcherConnect.wav") as AudioTrackAsset
const SHOCK_SOUND = requireAsset("../GeneratedSFX/SomeoneShockCue.wav") as AudioTrackAsset

@component
export class SomeoneMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">SomeoneMain - rescue flow orchestrator</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Root of the rescue space (figure, target, ring, cards). Moved in front of the user at start.")
  rescueSpace: SceneObject
  @input
  @hint("The one instruction card.")
  instructionCard: SomeoneInstructionCardUI
  @input
  @hint("Pace cue word beside the ring.")
  rateCue: SomeoneRateCueUI
  @input
  @hint("Time since collapse chip.")
  clockChip: SomeoneClockChipUI
  @input
  @hint("End-of-rescue replay.")
  replay: SomeoneReplayUI
  @input
  @hint("Chest target (pinch = one compression).")
  chestTarget: SomeoneChestTargetController
  @input
  @hint("Pace ring around the target.")
  paceRing: SomeonePaceRingController
  @input
  @hint("Spatial metronome at the chest.")
  metronome: SomeoneMetronome
  @input
  @hint("AED edge arrow and directional chime.")
  aedWayfinder: SomeoneAEDWayfinder
  @input
  @hint("AED pad placement overlay.")
  aedPads: SomeoneAEDPadsController
  @input
  @hint("Scripted dispatcher captions (stand-in).")
  dispatcher: SomeoneDispatcherController
  @input
  @allowUndefined
  @hint("Hand-tracked compressions (real glasses). Pinching the target stays the preview stand-in.")
  handCompression: SomeoneHandCompression
  @input
  @allowUndefined
  @hint("The person's chest gives under each push (stand-in figure).")
  victimReaction: SomeoneVictimReaction
  @input
  @allowUndefined
  @hint("Viewfinder corners that show the dispatcher now sees your view.")
  viewShare: SomeoneViewShareCue
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Shorter timers for the video: AED 0:45, swap 1:05, AED arrives 25 s after Sent, help 10 s after the shock.")
  demoMode: boolean = false

  @input
  @hint("Move the rescue space in front of wherever the user starts. Off = keep the authored position.")
  placeInFrontOfUser: boolean = true

  @input
  @hint("Horizontal distance from the eyes to the figure's chest, in cm.")
  @widget(new SliderWidget(60, 140, 1))
  chestDistanceCm: number = 85

  @input
  @hint("Floor distance below the eyes, in cm (about 75 for a kneeling rescuer).")
  @widget(new SliderWidget(40, 170, 1))
  eyeHeightAboveFloorCm: number = 75

  @input
  @hint("Volume of the button, dispatcher-connect and shock sounds.")
  @widget(new SliderWidget(0, 1, 0.05))
  cueVolume: number = 0.6
  @ui.group_end

  private sm = new SomeoneRescueStateMachine()
  private tapAudio: AudioComponent
  private connectAudio: AudioComponent
  private shockAudio: AudioComponent
  private framesUntilPlace = 3
  private ready = false
  private glancePlacer: SomeoneGlancePlacer | null = null

  onAwake(): void {
    const missing: string[] = []
    if (!this.rescueSpace) missing.push("rescueSpace")
    if (!this.instructionCard) missing.push("instructionCard")
    if (!this.rateCue) missing.push("rateCue")
    if (!this.clockChip) missing.push("clockChip")
    if (!this.replay) missing.push("replay")
    if (!this.chestTarget) missing.push("chestTarget")
    if (!this.paceRing) missing.push("paceRing")
    if (!this.metronome) missing.push("metronome")
    if (!this.aedWayfinder) missing.push("aedWayfinder")
    if (!this.aedPads) missing.push("aedPads")
    if (!this.dispatcher) missing.push("dispatcher")
    if (missing.length > 0) {
      console.error("[SomeoneMain] Missing @input wiring: " + missing.join(", "))
      return
    }
    this.tapAudio = this.makeAudio("TapAudio", TAP_SOUND)
    this.connectAudio = this.makeAudio("ConnectAudio", CONNECT_SOUND)
    this.shockAudio = this.makeAudio("ShockAudio", SHOCK_SOUND)

    this.sm.setDemoMode(this.demoMode)
    this.sm.addListener((e) => this.onRescueEvent(e))

    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    const camSo = WorldCameraFinderProvider.getInstance().getTransform().getSceneObject()
    if (!camSo.getComponent("Component.AudioListenerComponent")) {
      camSo.createComponent("Component.AudioListenerComponent")
    }
    this.tapAudio.playbackMode = Audio.PlaybackMode.LowLatency
    this.connectAudio.playbackMode = Audio.PlaybackMode.LowLatency
    this.shockAudio.playbackMode = Audio.PlaybackMode.LowPower

    this.instructionCard.onAction.add((a: CardAction) => {
      if (this.sm.action(a)) this.play(this.tapAudio)
    })
    this.chestTarget.onPinch.add(() => this.onChestPush())
    if (this.handCompression) this.handCompression.onCompression.add(() => this.onChestPush())
    this.replay.onRestart.add(() => {
      this.play(this.tapAudio)
      this.sm.start()
    })
    this.metronome.onBeat.add(() => this.paceRing.pulse())
    this.dispatcher.onCaption.add((text: string) => this.instructionCard.setCaption(text))

    this.ready = true
    this.sm.start()
    console.log("[SomeoneMain] Started. demoMode=" + this.demoMode)
  }

  private onUpdate(): void {
    if (!this.ready) return
    if (this.framesUntilPlace > 0) {
      this.framesUntilPlace--
      if (this.framesUntilPlace === 0) this.placeSpace()
    }
    if (this.glancePlacer) {
      const camPos = WorldCameraFinderProvider.getInstance().getTransform().getWorldPosition()
      this.glancePlacer.update(getDeltaTime(), camPos)
    }
    this.sm.tick(getDeltaTime(), getTime())
    this.clockChip.setTime(this.sm.elapsed)
    if (this.handCompression) this.chestTarget.setHandsOn(this.handCompression.handsOnChest)
  }

  /** One push on the chest, from a pinch (preview) or the tracked hands (glasses). */
  private onChestPush(): void {
    if (!this.sm.chestPinched(getTime())) return
    this.chestTarget.pressFeedback()
    if (this.victimReaction) this.victimReaction.push()
  }

  // ---- State machine -> views --------------------------------------------------
  private onRescueEvent(e: RescueEvent): void {
    switch (e.type) {
      case "visibleStateChanged":
        this.showState(e.state)
        break
      case "compression":
        this.onCompression(e.result)
        break
      case "rateReset":
        this.paceRing.setGrade("neutral")
        this.rateCue.clearCue()
        break
      case "dispatcherConnected":
        this.play(this.connectAudio)
        if (this.viewShare) this.viewShare.flash()
        break
      case "dispatcherCue":
        this.dispatcher.say(e.cue)
        break
      case "shock":
        this.aedPads.shockPulse()
        this.play(this.shockAudio)
        break
      case "replay":
        this.instructionCard.setCardVisible(false)
        this.replay.showReplay(e.stats)
        break
      case "restarted":
        this.replay.hideReplay()
        this.dispatcher.clear()
        this.paceRing.setGrade("neutral")
        this.rateCue.clearCue()
        break
      default:
        break
    }
    this.syncWorld()
  }

  private showState(state: RescueStateName): void {
    if (state === "Replay") return // replay event hides the card and shows the replay
    const copy = CARD_COPY[state]
    this.instructionCard.showStep(copy.line, copy.button, copy.action)
    if (state === "HelpArrives") this.dispatcher.clear()
  }

  private onCompression(r: CompressionResult): void {
    this.paceRing.setGrade(r.grade)
    if (r.direction === null) {
      this.rateCue.clearCue()
    } else if (r.direction === "good") {
      this.rateCue.setCue(CUE_COPY.good, PALETTE.mint)
    } else {
      const color = r.grade === "amber" ? PALETTE.amber : PALETTE.coral
      this.rateCue.setCue(r.direction === "faster" ? CUE_COPY.faster : CUE_COPY.slower, color)
    }
  }

  /** Make every world view match the state machine. Idempotent. */
  private syncWorld(): void {
    const compressing = this.sm.isCompressing
    this.chestTarget.setShown(this.sm.targetVisible)
    if (this.handCompression) this.handCompression.active = this.sm.targetVisible
    this.paceRing.setShown(compressing)
    if (compressing) this.metronome.startBeat()
    else this.metronome.stopBeat()
    if (!compressing) this.rateCue.clearCue()
    this.aedWayfinder.setShown(this.sm.aedPromptVisible)
    this.aedPads.setShown(this.sm.padsVisible)
    this.instructionCard.setBadgeVisible(this.sm.badgeVisible)
    this.clockChip.setChipVisible(this.sm.clockVisible)
  }

  // ---- Placement -------------------------------------------------------------------
  /** Put the chest `chestDistanceCm` ahead of the eyes, floor below, facing the user. */
  private placeSpace(): void {
    if (!this.placeInFrontOfUser) {
      this.faceViewsToCamera()
      return
    }
    const camT = WorldCameraFinderProvider.getInstance().getTransform()
    const camPos = camT.getWorldPosition()
    const fwd = camT.getWorldRotation().multiplyVec3(new vec3(0, 0, -1)) // camera looks down -Z
    let flat = new vec3(fwd.x, 0, fwd.z)
    if (flat.length < 0.001) flat = new vec3(0, 0, -1)
    flat = flat.normalize()
    const pos = new vec3(
      camPos.x + flat.x * this.chestDistanceCm,
      camPos.y - this.eyeHeightAboveFloorCm,
      camPos.z + flat.z * this.chestDistanceCm
    )
    // Root +Z points back at the user, so the figure lies across the view.
    const yaw = Math.atan2(-flat.x, -flat.z)
    const t = this.rescueSpace.getTransform()
    t.setWorldPosition(pos)
    t.setWorldRotation(quat.angleAxis(yaw, new vec3(0, 1, 0)))
    this.faceViewsToCamera()
    this.glancePlacer = new SomeoneGlancePlacer(
      [this.instructionCard.getSceneObject(), this.replay.getSceneObject()],
      this.chestTarget.getSceneObject()
    )
    this.glancePlacer.snap(camPos)
    console.log(
      "[SomeoneMain] Placed rescue space at " +
        pos.toString() +
        " (camera " +
        camPos.toString() +
        ")"
    )
  }

  /** Tilt each floating view so its face looks at the eyes (static, calm). */
  private faceViewsToCamera(): void {
    const camPos = WorldCameraFinderProvider.getInstance().getTransform().getWorldPosition()
    const views: SceneObject[] = [
      this.instructionCard.getSceneObject(),
      this.rateCue.getSceneObject(),
      this.clockChip.getSceneObject(),
      this.replay.getSceneObject()
    ]
    for (const so of views) {
      const t = so.getTransform()
      const dir = camPos.sub(t.getWorldPosition()).normalize()
      t.setWorldRotation(quat.lookAt(dir, vec3.up()))
    }
  }

  // ---- Audio -------------------------------------------------------------------------
  private makeAudio(name: string, track: AudioTrackAsset): AudioComponent {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.sceneObject)
    const a = so.createComponent("Component.AudioComponent") as AudioComponent
    a.audioTrack = track
    a.volume = this.cueVolume
    return a
  }

  private play(a: AudioComponent): void {
    if (!a || !a.audioTrack) return
    if (a.isPlaying()) a.stop(false)
    a.play(1)
  }

  // ---- Test surface (stable names) -----------------------------------------------------
  get stateName(): string {
    return this.sm.visibleState
  }
  get baseStateName(): string {
    return this.sm.baseState
  }
  get overlayName(): string {
    return this.sm.overlayState
  }
  get elapsedSeconds(): number {
    return this.sm.elapsed
  }
  get compressionCount(): number {
    return this.sm.stats.snapshot().totalCompressions
  }
  get gradedCompressionCount(): number {
    return this.sm.stats.snapshot().gradedCompressions
  }
  get onPaceCompressionCount(): number {
    return this.sm.stats.snapshot().onPaceCompressions
  }
  get onPacePercent(): number {
    return this.sm.stats.snapshot().onPacePercent
  }
  get longestStreak(): number {
    return this.sm.stats.snapshot().longestStreak
  }
  get timeToFirstCompression(): number {
    return this.sm.stats.snapshot().timeToFirstSec
  }
  /** Rolling rate per minute, or -1 while neutral. */
  get currentRate(): number {
    const r = this.sm.tracker.result.rate
    return r === null ? -1 : Math.round(r * 10) / 10
  }
  get ringColorState(): string {
    return this.paceRing.colorState
  }
  get rateCueText(): string {
    return this.rateCue.currentCue
  }
  /** Instruction card + replay. Must always be 0 or 1. */
  get visibleCardCount(): number {
    return (this.instructionCard.isCardShown ? 1 : 0) + (this.replay.isReplayShown ? 1 : 0)
  }
  get isRingVisible(): boolean {
    return this.paceRing.isShown
  }
  get isTargetVisible(): boolean {
    return this.chestTarget.isShown
  }
  get isAedArrowVisible(): boolean {
    return this.aedWayfinder.isShown
  }
  get aedChimeCount(): number {
    return this.aedWayfinder.chimeCount
  }
  get isBadgeVisible(): boolean {
    return this.instructionCard.isBadgeShown
  }
  get isClockVisible(): boolean {
    return this.clockChip.isChipShown
  }
  get arePadsVisible(): boolean {
    return this.aedPads.isShown
  }
  get isReplayVisible(): boolean {
    return this.replay.isReplayShown
  }
  get replayTotal(): number {
    return this.replay.shownTotal
  }
  get replayOnPacePercent(): number {
    return this.replay.shownOnPacePercent
  }
  get cardLine(): string {
    return this.instructionCard.currentLine
  }
  get cardButtonLabel(): string {
    return this.instructionCard.currentButtonLabel
  }
  get cardCaption(): string {
    return this.instructionCard.currentCaption
  }
  get metronomeRunning(): boolean {
    return this.metronome.isRunning
  }
  get isDemoMode(): boolean {
    return this.demoMode
  }
  get isViewShareShowing(): boolean {
    return this.viewShare ? this.viewShare.isShowing : false
  }

  /** Test hook: jump the collapse clock forward (timed prompts fire normally). */
  testAdvanceClock(seconds: number): void {
    this.sm.tick(seconds, getTime())
  }
}
