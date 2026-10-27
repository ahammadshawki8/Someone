/**
 * FlowRulesScenario: the flow rules behind the done criteria.
 * 1. The dispatcher finishes each spoken line before the next one starts,
 *    and skips waiting lines the flow has already moved past.
 * 2. A timed prompt that fires while another waits for its pinch queues
 *    behind it (still one card), and shows right after that pinch.
 * 3. During the rescuer swap the ring hides and pushes do not count;
 *    after "Swapped" they count again.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {DISPATCHER_LINES} from "../SomeoneConfig"
import {SomeoneMain} from "../SomeoneMain"

@component
export class FlowRulesScenario extends Scenario {
  async run(): Promise<void> {
    const mainObj = findSceneObjectByName("SomeoneExperience")
    if (!mainObj) throw new Error("SomeoneExperience scene object not found")
    const main = mainObj.getComponent(SomeoneMain.getTypeName()) as SomeoneMain
    if (!main) throw new Error("SomeoneMain component not found")
    const interactor = new DefaultLeafInteractor()
    const pressCard = async () => {
      const btn = getInteractables({sceneObjectName: "StepButton"})[0]
      if (!btn) throw new Error("StepButton not found")
      await interactor.trigger(btn)
      await sleep(400)
    }

    await sleep(600)
    await pressCard() // I see someone
    await pressCard() // Not breathing
    await pressCard() // Call 911: "connected" speaks, "placeHands" waits

    // 1. The first line is still up after 3 s (it used to be cut at 2.5 s)...
    expect(main.cardCaption).toBe(DISPATCHER_LINES.connected)
    await sleep(2600)
    expect(main.cardCaption).toBe(DISPATCHER_LINES.connected)
    // ...and the next line follows once it has been spoken.
    await sleep(2400)
    expect(main.cardCaption).toBe(DISPATCHER_LINES.placeHands)

    const chest = getInteractables({sceneObjectName: "ChestTarget"})[0]
    if (!chest) throw new Error("ChestTarget not found")
    await interactor.trigger(chest)
    await sleep(300)
    expect(main.stateName).toBe("Compress")

    // Let the dispatcher finish talking before jumping the clock.
    const quietBy = getTime() + 15
    while (main.cardCaption !== "" && getTime() < quietBy) await sleep(200)
    expect(main.cardCaption).toBe("")

    // 2. AED prompt fires and is left unanswered; the swap time passes.
    main.testAdvanceClock(95)
    await sleep(300)
    expect(main.overlayName).toBe("SendForAED")
    main.testAdvanceClock(30)
    await sleep(300)
    expect(main.overlayName).toBe("SendForAED")
    expect(main.visibleCardCount).toBe(1)
    await pressCard() // Sent: the queued swap shows now
    expect(main.overlayName).toBe("Swap")
    expect(main.visibleCardCount).toBe(1)

    // The dispatcher finishes the AED line, then says the newest thing (the
    // swap), skipping the "sent" line the flow has already moved past.
    await sleep(5500)
    expect(main.cardCaption).toBe(DISPATCHER_LINES.swap)

    // 3. Swap: ring hidden, pushes ignored.
    expect(main.isRingVisible).toBe(false)
    const before = main.compressionCount
    await interactor.trigger(chest)
    await sleep(200)
    await interactor.trigger(chest)
    await sleep(200)
    expect(main.compressionCount).toBe(before)

    await pressCard() // Swapped
    expect(main.overlayName).toBe("none")
    await interactor.trigger(chest)
    await sleep(300)
    expect(main.compressionCount).toBe(before + 1)
    expect(main.isRingVisible).toBe(true)
  }
}
