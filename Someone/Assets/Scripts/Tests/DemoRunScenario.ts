/**
 * DemoRunScenario: the whole rescue, end to end, at a human pace.
 * Run it with SomeoneMain.demoMode on (AED at 0:45, swap 1:05). It reads
 * each card for a moment, pushes at a steady 110 per minute, answers the
 * AED and swap prompts, rides through the AED sequence, resumes, and ends
 * on the replay. Used to record the demo video, and as an end-to-end check.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

const PUSH_MS = 545 // 110 per minute

@component
export class DemoRunScenario extends Scenario {
  async run(): Promise<void> {
    const mainObj = findSceneObjectByName("SomeoneExperience")
    if (!mainObj) throw new Error("SomeoneExperience scene object not found")
    const main = mainObj.getComponent(SomeoneMain.getTypeName()) as SomeoneMain
    if (!main) throw new Error("SomeoneMain component not found")
    const interactor = new DefaultLeafInteractor()

    const pressCard = async (readMs: number) => {
      if (readMs > 0) await sleep(readMs)
      const btn = getInteractables({sceneObjectName: "StepButton"})[0]
      if (!btn) throw new Error("StepButton not found")
      await interactor.trigger(btn)
    }
    // Steady pushes until `until()` is true (or a safety cap).
    const pushUntil = async (until: () => boolean, capSec: number) => {
      const chest = getInteractables({sceneObjectName: "ChestTarget"})[0]
      if (!chest) throw new Error("ChestTarget not found")
      const stop = getTime() + capSec
      while (!until() && getTime() < stop) {
        const t0 = getTime()
        await interactor.trigger(chest)
        await sleep(Math.max(10, Math.round(PUSH_MS - (getTime() - t0) * 1000)))
      }
    }

    await pressCard(2500) // "Someone collapsed." -> I see someone
    await pressCard(2500) // "Tap their shoulder. Are they breathing?" -> Not breathing
    await pressCard(2000) // "Get help now." -> Call 911
    await sleep(3500) // dispatcher connects; "Push here."

    // Compress until the AED prompt arrives.
    await pushUntil(() => main.overlayName === "SendForAED", 90)
    expect(main.ringColorState).toBe("good")
    // Keep pushing while reading the prompt, then send one person.
    await pushUntil(() => false, 4)
    await pressCard(0)

    // Compress until the swap prompt.
    await pushUntil(() => main.overlayName === "Swap", 60)
    await pressCard(3000) // Swapped

    // New hands: compress until the AED arrives.
    await pushUntil(() => main.baseStateName === "AEDArrives", 60)
    // Pads, stand clear, simulated shock: hands off.
    const resumeBy = getTime() + 20
    while (main.baseStateName !== "Resume" && getTime() < resumeBy) await sleep(200)
    await sleep(1500)

    // Resume until help arrives, then watch the replay.
    await pushUntil(() => main.baseStateName === "HelpArrives", 30)
    const replayBy = getTime() + 15
    while (!main.isReplayVisible && getTime() < replayBy) await sleep(200)
    expect(main.isReplayVisible).toBe(true)
    await sleep(6000)
  }
}
