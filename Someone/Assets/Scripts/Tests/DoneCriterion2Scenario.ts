/**
 * DoneCriterion2Scenario: Tests Done Criterion 2.
 * Pinching the target at a steady 100 to 120 per minute turns the ring green.
 * Slower than 100 shows "Faster", and quicker than 120 shows "Slower".
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

@component
export class DoneCriterion2Scenario extends Scenario {
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
    expect(main.stateName).toBe("PlaceHands")

    const chestTarget = getInteractables({sceneObjectName: "ChestTarget"})[0]
    if (!chestTarget) throw new Error("ChestTarget not found")

    // First pinch starts compressions
    await interactor.trigger(chestTarget)
    await sleep(145)
    expect(main.stateName).toBe("Compress")

    // Steady pace pinches: target 110 bpm (~545ms interval) with adaptive sleep
    for (let i = 0; i < 6; i++) {
      const t0 = getTime()
      await interactor.trigger(chestTarget)
      const elapsedMs = (getTime() - t0) * 1000
      const toSleep = Math.max(10, Math.round(545 - elapsedMs))
      await sleep(toSleep)
    }

    // Verify steady rate: 100 to 120 bpm turns ring to good (mint) and rate cue says "Good."
    expect(main.ringColorState).toBe("good")
    expect(main.rateCueText.includes("Good")).toBe(true)

    // Slower pace pinches: target ~75 bpm (~800ms interval) with adaptive sleep
    for (let i = 0; i < 5; i++) {
      const t0 = getTime()
      await interactor.trigger(chestTarget)
      const elapsedMs = (getTime() - t0) * 1000
      const toSleep = Math.max(10, Math.round(800 - elapsedMs))
      await sleep(toSleep)
    }

    // Verify slow rate: shows "Faster."
    expect(main.rateCueText.includes("Faster")).toBe(true)

    // Faster pace pinches: trigger immediately back-to-back with nextFrame (~380ms = ~155 bpm)
    for (let i = 0; i < 6; i++) {
      await interactor.trigger(chestTarget)
      await nextFrame()
    }

    // Verify fast rate: shows "Slower."
    expect(main.rateCueText.includes("Slower")).toBe(true)
  }
}
