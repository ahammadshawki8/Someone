/**
 * DoneCriterion5Scenario: Tests Done Criterion 5.
 * The replay shows the correct total compression count and on-pace percentage
 * for the pinches made.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

@component
export class DoneCriterion5Scenario extends Scenario {
  async run(): Promise<void> {
    const mainObj = findSceneObjectByName("SomeoneExperience")
    if (!mainObj) throw new Error("SomeoneExperience scene object not found")
    const main = mainObj.getComponent(SomeoneMain.getTypeName()) as SomeoneMain
    if (!main) throw new Error("SomeoneMain component not found")

    const interactor = new DefaultLeafInteractor()
    await sleep(600)

    // Navigate to PlaceHands
    for (let i = 0; i < 3; i++) {
      const btn = getInteractables({sceneObjectName: "StepButton"})[0]
      if (btn) {
        await interactor.trigger(btn)
        await sleep(600)
      }
    }

    const chestTarget = getInteractables({sceneObjectName: "ChestTarget"})[0]
    if (!chestTarget) throw new Error("ChestTarget not found")

    // Deliver 6 compressions at steady pace (~110 bpm) with adaptive sleep
    for (let i = 0; i < 6; i++) {
      const t0 = getTime()
      await interactor.trigger(chestTarget)
      const elapsedMs = (getTime() - t0) * 1000
      const toSleep = Math.max(10, Math.round(545 - elapsedMs))
      await sleep(toSleep)
    }

    const recordedCompressions = main.compressionCount
    const recordedOnPacePercent = main.onPacePercent
    expect(recordedCompressions).toBe(6)

    // Advance to AED prompt and dismiss with "Sent"
    main.testAdvanceClock(95)
    await sleep(600)
    const sentBtn = getInteractables({sceneObjectName: "StepButton"})[0]
    if (sentBtn) {
      await interactor.trigger(sentBtn)
      await sleep(600)
    }

    // Step clock forward through Swap, AED arrival, pads, shock, help arrival to Replay
    for (let i = 0; i < 20; i++) {
      main.testAdvanceClock(10)
      await sleep(100)
      if (main.stateName === "Swap") {
        const swapBtn = getInteractables({sceneObjectName: "StepButton"})[0]
        if (swapBtn) {
          await interactor.trigger(swapBtn)
          await sleep(600)
        }
      }
    }

    // Verify replay values match recorded session stats
    expect(main.isReplayVisible).toBe(true)
    expect(main.replayTotal).toBe(recordedCompressions)
    expect(main.replayOnPacePercent).toBe(recordedOnPacePercent)
  }
}
