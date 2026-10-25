/**
 * DoneCriterion4Scenario: Tests Done Criterion 4.
 * At 1:30 since the collapse (or the shortened demo-mode time), the AED arrow and chime appear,
 * and pinching "Sent" dismisses both.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

@component
export class DoneCriterion4Scenario extends Scenario {
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
    await interactor.trigger(chestTarget)
    await sleep(600)

    // Initially arrow is not shown
    expect(main.isAedArrowVisible).toBe(false)

    // Fast-forward clock to AED prompt (90s in real time)
    main.testAdvanceClock(95)
    await sleep(600)

    // Verify AED wayfinder arrow and chime
    expect(main.isAedArrowVisible).toBe(true)
    expect(main.aedChimeCount).toBeGreaterThan(0)
    expect(main.cardLine.includes("AED")).toBe(true)
    expect(main.cardButtonLabel).toBe("Sent")

    // Pinch "Sent" button to dismiss
    const sentBtn = getInteractables({sceneObjectName: "StepButton"})[0]
    if (!sentBtn) throw new Error("Sent button not found")
    await interactor.trigger(sentBtn)
    await sleep(600)

    // Verify arrow is dismissed
    expect(main.isAedArrowVisible).toBe(false)
  }
}
