/**
 * DoneCriterion3Scenario: Tests Done Criterion 3.
 * Only one instruction card is visible at any moment across the whole flow,
 * from "I see someone" to the replay.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

@component
export class DoneCriterion3Scenario extends Scenario {
  async run(): Promise<void> {
    const mainObj = findSceneObjectByName("SomeoneExperience")
    if (!mainObj) throw new Error("SomeoneExperience scene object not found")
    const main = mainObj.getComponent(SomeoneMain.getTypeName()) as SomeoneMain
    if (!main) throw new Error("SomeoneMain component not found")

    const interactor = new DefaultLeafInteractor()
    await sleep(600)

    // At Collapse: exactly one card visible
    expect(main.visibleCardCount).toBe(1)

    // Pinch "I see someone" -> Check
    const stepBtn1 = getInteractables({sceneObjectName: "StepButton"})[0]
    await interactor.trigger(stepBtn1)
    await sleep(600)
    expect(main.visibleCardCount).toBe(1)

    // Pinch "Not breathing" -> Call
    const stepBtn2 = getInteractables({sceneObjectName: "StepButton"})[0]
    await interactor.trigger(stepBtn2)
    await sleep(600)
    expect(main.visibleCardCount).toBe(1)

    // Pinch "Call 911" -> PlaceHands
    const stepBtn3 = getInteractables({sceneObjectName: "StepButton"})[0]
    await interactor.trigger(stepBtn3)
    await sleep(600)
    expect(main.visibleCardCount).toBe(1)

    // Pinch ChestTarget -> Compress
    const chestTarget = getInteractables({sceneObjectName: "ChestTarget"})[0]
    await interactor.trigger(chestTarget)
    await sleep(600)
    expect(main.visibleCardCount).toBe(1)

    // Advance clock to trigger SendForAED (95 s)
    main.testAdvanceClock(95)
    await sleep(600)
    expect(main.visibleCardCount).toBe(1)

    // Pinch "Sent" button to acknowledge AED wayfinding
    const sentBtn = getInteractables({sceneObjectName: "StepButton"})[0]
    if (sentBtn) {
      await interactor.trigger(sentBtn)
      await sleep(600)
    }
    expect(main.visibleCardCount).toBe(1)

    // Advance clock in steps through Swap, AED arrival, pads, stand clear, help arrival to replay
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
      expect(main.visibleCardCount).toBe(1)
    }

    // At Replay: instruction card is hidden, only replay panel is shown (visibleCardCount is 1)
    expect(main.visibleCardCount).toBe(1)
    expect(main.isReplayVisible).toBe(true)
  }
}
