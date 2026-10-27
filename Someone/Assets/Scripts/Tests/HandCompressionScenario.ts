/**
 * HandCompressionScenario: hand-tracked compressions (logic proven, feel unproven).
 * Not a done criterion: the preview cannot track real hands. It drives the
 * real detector and the real Main path with synthetic palm heights:
 * a 5 cm stroke at 110 per minute counts each push and turns the ring green,
 * and a hand resting on the chest with a small tremor counts nothing.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getInteractables} from "Leaf.lspkg/Interactors/InteractableUtils"
import {SomeoneMain} from "../SomeoneMain"

@component
export class HandCompressionScenario extends Scenario {
  async run(): Promise<void> {
    const mainObj = findSceneObjectByName("SomeoneExperience")
    if (!mainObj) throw new Error("SomeoneExperience scene object not found")
    const main = mainObj.getComponent(SomeoneMain.getTypeName()) as SomeoneMain
    if (!main) throw new Error("SomeoneMain component not found")
    const hands = main.handCompression
    if (!hands) throw new Error("SomeoneMain.handCompression is not wired")

    const interactor = new DefaultLeafInteractor()
    await sleep(600)
    for (let i = 0; i < 3; i++) {
      const btn = getInteractables({sceneObjectName: "StepButton"})[0]
      if (btn) {
        await interactor.trigger(btn)
        await sleep(600)
      }
    }
    expect(main.stateName).toBe("PlaceHands")

    // Hands on the chest, pushing 5 cm deep at 110 per minute for 5 s.
    const hz = 110 / 60
    let t0 = getTime()
    while (getTime() - t0 < 5) {
      const t = getTime() - t0
      hands.feedSample(2.5 + 2.5 * Math.cos(2 * Math.PI * hz * t))
      await nextFrame()
    }
    expect(main.stateName).toBe("Compress")
    expect(main.compressionCount).toBeGreaterThan(7)
    expect(main.ringColorState).toBe("good")

    // Hands settle on the chest (that last drop may count as one push)...
    t0 = getTime()
    while (getTime() - t0 < 0.5) {
      hands.feedSample(1.0)
      await nextFrame()
    }
    // ...then rest there with a small tremor: nothing counts.
    const before = main.compressionCount
    t0 = getTime()
    while (getTime() - t0 < 2) {
      const t = getTime() - t0
      hands.feedSample(1.0 + 0.4 * Math.sin(2 * Math.PI * 8 * t))
      await nextFrame()
    }
    expect(main.compressionCount).toBe(before)
  }
}
