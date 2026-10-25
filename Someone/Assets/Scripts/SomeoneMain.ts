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
import {SomeoneRescuePerimeter} from "./SomeoneRescuePerimeter"
import {SomeoneHandPlacementGuide} from "./SomeoneHandPlacementGuide"
import {SomeoneCompressionRipples} from "./SomeoneCompressionRipples"
import {SomeoneSternumLandmark} from "./SomeoneSternumLandmark"
import {SomeoneVictimAnimator} from "./SomeoneVictimAnimator"

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
  @hint("Floor rescue perimeter boundary.")
  perimeter: SomeoneRescuePerimeter
  @input
  @allowUndefined
  @hint("Holographic hand placement guide.")
  handsGuide: SomeoneHandPlacementGuide
  @input
  @allowUndefined
  @hint("Kinetic compression depth ripples.")
  ripples: SomeoneCompressionRipples
  @input
  @allowUndefined
  @hint("Anatomical sternum alignment landmark.")
  sternumLandmark: SomeoneSternumLandmark
  @input
  @allowUndefined
  @hint("Dynamic responsive victim physics.")
  victimAnimator: SomeoneVictimAnimator
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

  @input
  @hint("Real Victim Mode: hides dummy mesh when filming with a real person.")
  realVictimMode: boolean = false
  @ui.group_end

  private sm = new SomeoneRescueStateMachine()
  private tapAudio: AudioComponent
  private connectAudio: AudioComponent
  private shockAudio: AudioComponent
  private framesUntilPlace = 3
  private ready = false
  private glancePlacer: SomeoneGlancePlacer | null = null
  private isPractice = false

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
    if (!this.perimeter && this.rescueSpace) {
      this.perimeter = this.rescueSpace.createComponent(SomeoneRescuePerimeter.getTypeName()) as SomeoneRescuePerimeter
    }
    if (!this.handsGuide && this.rescueSpace) {
      this.handsGuide = this.rescueSpace.createComponent(SomeoneHandPlacementGuide.getTypeName()) as SomeoneHandPlacementGuide
      if (this.chestTarget) this.handsGuide.chestTarget = this.chestTarget.getSceneObject()
    }
    if (!this.ripples && this.rescueSpace) {
      this.ripples = this.rescueSpace.createComponent(SomeoneCompressionRipples.getTypeName()) as SomeoneCompressionRipples
      if (this.chestTarget) this.ripples.chestTarget = this.chestTarget.getSceneObject()
    }
    if (!this.sternumLandmark && this.rescueSpace) {
      this.sternumLandmark = this.rescueSpace.createComponent(SomeoneSternumLandmark.getTypeName()) as SomeoneSternumLandmark
    }
    if (!this.victimAnimator && this.rescueSpace) {
      this.victimAnimator = this.rescueSpace.createComponent(SomeoneVictimAnimator.getTypeName()) as SomeoneVictimAnimator
      if (this.realVictimMode) this.victimAnimator.setDummyVisible(false)
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
      if (this.isPractice) {
        this.play(this.tapAudio)
        this.exitPractice()
        return
      }
      if (this.sm.action(a)) this.play(this.tapAudio)
    })
    this.chestTarget.onPinch.add(() => {
      if (this.handsGuide && this.handsGuide.isShown) {
        this.handsGuide.pressDown()
      }
      if (this.victimAnimator) {
        this.victimAnimator.compress()
      }
      if (this.isPractice) {
        const r = this.sm.tracker.addCompression(getTime())
        this.sm.stats.record(r.grade, 0)
        this.onCompression(r)
        this.chestTarget.pressFeedback()
        return
      }
      if (this.sm.chestPinched(getTime())) this.chestTarget.pressFeedback()
    })
    this.replay.onRestart.add(() => {
      this.play(this.tapAudio)
      this.sm.start()
    })
    this.replay.onPractice.add(() => {
      this.play(this.tapAudio)
      this.startPractice()
    })
    this.metronome.onBeat.add(() => this.paceRing.pulse())
    this.dispatcher.onCaption.add((text: string) => this.instructionCard.setCaption(text))

    // Stylize victim figure: emergency navy responder clothing on torso & legs
    const findChild = (parent: SceneObject, name: string): SceneObject | null => {
      for (let i = 0; i < parent.getChildrenCount(); i++) {
        const c = parent.getChild(i)
        if (c.name === name) return c
        const sub = findChild(c, name)
        if (sub) return sub
      }
      return null
    }
    const figure = findChild(this.rescueSpace, "VictimFigure_StandIn")
    if (figure) {
      const clothingColor = new vec4(0.18, 0.24, 0.34, 1.0)
      for (const name of ["Torso", "LegNear", "LegFar"]) {
        const part = findChild(figure, name)
        if (part) {
          const rmv = part.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
          if (rmv && rmv.mainMaterial) {
            const clone = rmv.mainMaterial.clone()
            clone.mainPass.baseColor = clothingColor
            rmv.mainMaterial = clone
          }
        }
      }
    }

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
        if (this.handsGuide) this.handsGuide.setShown(false, true)
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
    if (this.victimAnimator) {
      if (state === "Collapse") this.victimAnimator.setBreathing(true)
      else if (state === "Call") this.victimAnimator.setBreathing(false)
      else if (state === "PlaceHands" || state === "Compress") this.victimAnimator.setAirwayOpen(true)
      else if (state === "HelpArrives") this.victimAnimator.triggerRecoveryGasp()
    }
  }

  private onCompression(r: CompressionResult): void {
    if (this.ripples) {
      this.ripples.emit(r.grade)
    }
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
    this.paceRing.setShown(compressing)
    if (this.handsGuide) {
      const showHands = this.sm.visibleState === "PlaceHands"
      this.handsGuide.setShown(showHands)
    }
    if (compressing) this.metronome.startBeat()
    else this.metronome.stopBeat()
    if (!compressing) this.rateCue.clearCue()
    this.aedWayfinder.setShown(this.sm.aedPromptVisible)
    this.aedPads.setShown(this.sm.padsVisible)
    this.instructionCard.setBadgeVisible(this.sm.badgeVisible)
    this.clockChip.setChipVisible(this.sm.clockVisible)
    if (this.sternumLandmark) {
      this.sternumLandmark.setShown(this.sm.targetVisible)
    }
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

  // ---- Practice Mode -------------------------------------------------------------
  private startPractice(): void {
    this.isPractice = true
    this.replay.hideReplay()
    this.sm.tracker.reset()
    this.paceRing.setGrade("neutral")
    this.rateCue.clearCue()
    this.chestTarget.setShown(true)
    this.paceRing.setShown(true)
    this.metronome.startBeat()
    if (this.sternumLandmark) this.sternumLandmark.setShown(true)
    this.instructionCard.showStep("Cadence Practice. Target 110 bpm.", "End practice", "seeSomeone")
  }

  private exitPractice(): void {
    this.isPractice = false
    this.metronome.stopBeat()
    this.paceRing.setShown(false)
    this.chestTarget.setShown(false)
    this.instructionCard.setCardVisible(false)
    if (this.sternumLandmark) this.sternumLandmark.setShown(false)
    this.replay.showReplay(this.sm.stats.snapshot())
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

  /** Test hook: jump the collapse clock forward (timed prompts fire normally). */
  testAdvanceClock(seconds: number): void {
    this.sm.tick(seconds, getTime())
  }
}
