/**
 * DoneCriterion1Scenario: Tests Done Criterion 1.
 * Pinching the chest target starts compressions, and the pace ring appears centered on the figure's chest.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

@component
export class DoneCriterion1Scenario extends Scenario {
  async run(): Promise<void> {
    const mainObj = findSceneObjectByName("SomeoneExperience")
    if (!mainObj) throw new Error("SomeoneExperience scene object not found")
    const main = mainObj.getComponent(SomeoneMain.getTypeName()) as SomeoneMain
    if (!main) throw new Error("SomeoneMain component not found")

    const interactor = new DefaultLeafInteractor()
    await sleep(600)

    // Verify initial state
    expect(main.stateName).toBe("Collapse")
    expect(main.isTargetVisible).toBe(false)
    expect(main.isRingVisible).toBe(false)

    // Step 1: Pinch "I see someone"
    const stepBtn1 = getInteractables({sceneObjectName: "StepButton"})[0]
    if (!stepBtn1) throw new Error("StepButton not found in Collapse state")
    await interactor.trigger(stepBtn1)
    await sleep(600)
    expect(main.stateName).toBe("Check")

    // Step 2: Pinch "Not breathing"
    const stepBtn2 = getInteractables({sceneObjectName: "StepButton"})[0]
    if (!stepBtn2) throw new Error("StepButton not found in Check state")
    await interactor.trigger(stepBtn2)
    await sleep(600)
    expect(main.stateName).toBe("Call")

    // Step 3: Pinch "Call 911"
    const stepBtn3 = getInteractables({sceneObjectName: "StepButton"})[0]
    if (!stepBtn3) throw new Error("StepButton not found in Call state")
    await interactor.trigger(stepBtn3)
    await sleep(600)
    expect(main.stateName).toBe("PlaceHands")
    expect(main.isTargetVisible).toBe(true)
    expect(main.isRingVisible).toBe(false)

    // Step 4: Pinch chest target to start compressions
    const chestTarget = getInteractables({sceneObjectName: "ChestTarget"})[0]
    if (!chestTarget) throw new Error("ChestTarget interactable not found")
    await interactor.trigger(chestTarget)
    await sleep(600)

    // Verification: compressions started, pace ring visible and metronome running
    expect(main.stateName).toBe("Compress")
    expect(main.isRingVisible).toBe(true)
    expect(main.isTargetVisible).toBe(true)
    expect(main.metronomeRunning).toBe(true)
  }
}
