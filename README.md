# Someone

**Be the someone.**

When someone collapses, most people freeze. Someone is a Snap SPECS Lens that guides you through CPR, hands-free, one calm step at a time, with 911 seeing what you see.

Built for the Devpost "Learn AR with SPECS" hackathon. Planned with the `plan-lens` skill, built by a coding agent through CLAD and the Lens Studio MCP, and checked with LEAF tests in the Lens Studio preview.

---

## Who it's for

Ordinary people, trained or not, who would freeze in an emergency. That is most people.

- About 263,700 EMS-treated out-of-hospital cardiac arrests happen in the US each year, and only about 10.5% of patients survive to hospital discharge (CARES 2024, via the AHA 2025 Guidelines).
- Only about 42% of patients get bystander CPR (CARES 2025).
- Of CPR-trained bystanders who did not help, 37% said they simply panicked (Swor et al., *Academic Emergency Medicine*, 2006).
- The more people present, the less likely any one of them acts: the bystander effect (Darley and Latane, 1968). Everyone waits for "someone".

The barrier is not knowledge. It is the freeze. Existing AR CPR work focuses on technique feedback. Someone is designed for the first frozen seconds.

## Why glasses

CPR needs both hands and your eyes on the person. A phone has to be put down, and then it cannot guide you. Someone uses all three things glasses do that a phone cannot:

1. **Leaves your body free.** Both hands compress; your eyes stay on the person.
2. **Draws in the world.** The target sits on the chest at real size, where your hands go.
3. **Shares your view.** The dispatcher sees what you see.

## What it does

One spatial moment carries the Lens: you kneel by the person, a target glows on the center of the chest, and a ring around it pulses at 110 per minute with a soft beat coming from the chest. Every push is scored against the guideline rate of 100 to 120 per minute.

The flow, one instruction at a time:

1. "Someone collapsed." Pinch **I see someone**.
2. "Tap their shoulder. Are they breathing?" Pinch **Not breathing**.
3. Pinch **Call 911**. A badge reads "Dispatcher connected, viewing", and a calm scripted dispatcher speaks with captions.
4. "Push here." Pinch the chest target. Each pinch is one compression. The ring turns mint at 100 to 120 per minute and shows "Faster." or "Slower." when you drift.
5. At 1:30, a chime from the side and an arrow at the edge of view: "AED, 40 m. Send someone." Pinch **Sent**.
6. At 2:00: "Switch with a helper if you can." The ring hides until you pinch **Swapped**.
7. The AED arrives: pads show on the chest, "Stand clear.", the AED delivers a simulated shock, and you resume compressions.
8. "Help is here." A calm replay shows total compressions, % on pace, longest on-pace streak and time to first compression, then one line: *You did not freeze.*

A small clock low beside the shoulder shows time since collapse. Timed prompts that fire while another prompt is waiting queue behind it, so there is never more than one card. A demo-mode flag shortens the timers so the full run fits in a video.

## Stand-ins (what the preview cannot show)

- **The person** is a virtual figure on the floor. Real glasses would need to recognize a real person and find the chest; the preview cannot, so you pinch the chest once to place the target.
- **A compression** is one pinch (one mouse click in the preview). Real hand tracking could read the push itself; this build does not measure depth or hand motion.
- **The 911 dispatcher** is scripted voice lines with captions. There is no real call and no real video share.
- **The AED, the helper and the shock** are scripted on timers.

## Design

Calm, clinical, the opposite of an alarm. The SPECS display is additive (black renders transparent), so there are no dark panels: light, luminous elements sit directly on the world.

- Four colors only: pulse coral `#FF5A4E` (ring and target), on-pace mint `#5CF2B5`, caution amber `#FFC24D`, warm white `#F7F5F2` text.
- One typeface, large, sentence case, short verbs ("Push here.", "Faster.").
- Slow 300 to 500 ms fades. The ring pulse is the only rhythmic motion.
- Content sits 0.6 to 1.6 m away and below eye level, clustered around the chest. The card floats about 30 cm above the chest so hands and words share one glance.

## How it was built

1. **Planned with `plan-lens`.** The skill interviewed the owner one question at a time and wrote [`devpost/design-brief.md`](devpost/design-brief.md) (status: approved) with five done criteria.
2. **Built by a coding agent through CLAD and the Lens Studio MCP.** Scripts, scene wiring, procedural meshes and synthesized sound effects were created through the MCP in Lens Studio 5.24.1.
3. **Tested with LEAF.** Each done criterion has one LEAF scenario in `Someone/Assets/Scripts/Tests/`, driving real SIK pinches in the preview.

| # | Done criterion | Scenario |
|---|---|---|
| 1 | Pinching the chest target starts compressions, and the pace ring appears centered on the chest | `DoneCriterion1Scenario.ts` |
| 2 | A steady 100 to 120 per minute turns the ring green; slower shows "Faster", quicker shows "Slower" | `DoneCriterion2Scenario.ts` |
| 3 | Only one instruction card is visible at any moment, from "I see someone" to the replay | `DoneCriterion3Scenario.ts` |
| 4 | At 1:30 (or the demo time) the AED arrow and chime appear; pinching "Sent" dismisses both | `DoneCriterion4Scenario.ts` |
| 5 | The replay shows the correct compression count and on-pace percentage | `DoneCriterion5Scenario.ts` |

Architecture: one pure-logic state machine (`SomeoneRescueStateMachine`) is the single source of truth. A compression tracker computes a rolling rate from the last five pinch intervals, a session-stats module feeds the replay, and every visual is a passive view driven by state-machine events.

## Run it

1. Open `Someone/Someone.esproj` in Lens Studio 5.24.1 or later.
2. In the Preview panel choose Interactive Preview. Click acts as a pinch; WASD moves, Q and E go down and up, right-drag looks around.
3. On `SomeoneExperience`, tick `demoMode` for the short timers.
4. Run the LEAF scenarios from the LEAF panel.

## Pre-existing assets and packages

- Spectacles Interaction Kit and Spectacles UI Kit (Snap).
- LEAF testing packages (Snap).
- Lens Studio SPECS Base Template.
- Everything else (scripts, meshes, materials, sound effects, copy) was made for this project. Sound effects were synthesized locally (`tools/gen_sfx_someone.js`).

## What we learned

- Designing for panic means taking things away. Every extra label we tried competed with the one instruction that mattered.
- On an additive display, "contrast" means light on the world, not text on a panel.
- A rolling rate over a few intervals is the right unit of feedback; a single click is too noisy to judge.
- The preview is honest about its limits. Naming each stand-in made the design clearer, not weaker.

## Medical note

Someone is a design concept and practice tool, not a medical device. CPR circulates blood; it does not restart a heart. Guidance aligns with the published rate of 100 to 120 per minute. Take a certified CPR and AED course.
