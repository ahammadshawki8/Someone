# Someone: Be the someone

## Elevator pitch (under 200 characters)

When someone collapses, most people freeze. Someone is a SPECS Lens that guides you through CPR, hands-free, one calm step at a time, with 911 seeing what you see.

---

## Inspiration

About 263,700 EMS-treated cardiac arrests happen outside hospitals in the US each year. Only about 42% of patients get CPR from a bystander, and survival falls by roughly 10% for every minute without CPR and defibrillation.

The barrier is rarely knowledge. Of CPR-trained bystanders who did not help, 37% said they simply panicked (Swor et al., 2006). And the more people present, the less likely any one of them acts: the bystander effect. Everyone waits for "someone".

Existing AR CPR projects grade technique on a mannequin in a classroom. Nobody designs for the freeze. We asked: what if your glasses took over the thinking for those first seconds, so your hands could do the work?

## What it does

Someone is one spatial moment, done carefully. You kneel by the person. A target glows on the center of their chest at real size, and a ring around it pulses at 110 per minute with a soft beat that comes from the chest itself. Every push is scored: the ring turns mint between 100 and 120 per minute and says "Faster." or "Slower." when you drift.

Around that moment, a short story keeps you moving, one instruction at a time:

- **Check and call.** "Tap their shoulder. Are they breathing?" Then one big "Call 911" button.
- **The dispatcher sees what you see.** A badge reads "Dispatcher connected, viewing" and a calm scripted voice coaches you, with captions for every line.
- **AED wayfinding.** At 1:30 a chime comes from one side and an arrow points out of view: "AED, 40 m. Send someone."
- **Rescuer swap.** At 2:00: "Switch with a helper if you can." Scoring pauses for the handoff.
- **The AED.** Pads appear on the chest, "Stand clear.", the AED delivers a simulated shock, and you resume.
- **Replay.** When help arrives: compressions, % on pace, longest on-pace streak, time to first compression, and one line: *You did not freeze.*

## Why it belongs on glasses

CPR needs both hands and your eyes on the person. A phone has to be put down, and then it cannot guide you. Someone uses all three strengths of glasses: it **leaves your body free**, it **draws in the world** (the guide sits on the chest where your hands go), and it **shares your view** (the dispatcher sees through your eyes).

## Design

- **One instruction at a time.** Panic shrinks attention, so only one card is ever visible. Timed prompts that fire while you owe a pinch wait in line behind it.
- **Attached to the task.** Target and ring on the sternum, the card 30 cm above the chest so words and hands share one glance, the clock small and low by the shoulder, never in the center.
- **Out of view, but not out of mind.** The AED is behind you, so it gets a directional chime and an edge arrow, not another panel.
- **Built for an additive display.** Black renders transparent on SPECS, so there are no dark panels. Four colors only: coral for the pulse, mint for on pace, amber for caution, warm white for text.
- **Calm motion.** Slow fades. The ring's pulse is the only rhythmic motion in the Lens.

## How we built it

- **Planned with `plan-lens`.** The skill interviewed us one question at a time and produced an approved design brief with five done criteria, each checkable in the preview.
- **Built through CLAD and the Lens Studio MCP.** A coding agent wrote the TypeScript components, wired the scene, generated the meshes and synthesized the sound effects inside Lens Studio 5.24.1.
- **One source of truth.** A pure-logic rescue state machine drives every view. A compression tracker computes a rolling rate from the last five intervals; a stats module feeds the replay.
- **Tested with LEAF.** One LEAF scenario per done criterion drives real pinches in the preview: target starts compressions, rate bands, one card at a time, AED prompt and dismissal, and replay accuracy.
- **Spatial audio.** The metronome plays from the chest position and the AED chime from the AED's direction.

## Stand-ins

The preview cannot recognize a real person, read real hand pushes or place a real call, so:

- A virtual figure on the floor stands in for the person; one pinch on the chest places the target.
- One pinch on the target counts as one compression. Depth is not measured.
- The dispatcher, the AED, the helper and the shock are scripted.

## Challenges we ran into

- **Additive color.** Without dark panels, readability had to come from light text and luminous shapes over the room.
- **Standing versus kneeling.** The card has to stay in the same glance as the hands at any head height, so it eases between heights instead of sitting at a fixed one.
- **Timers versus pinches.** AED and swap prompts run on the clock but must never stack, which needed a small queue in the state machine.
- **Restraint.** We built extra effects along the way (floor perimeter, holographic hands, ripples) and removed them. Each one competed with the single instruction that matters.

## Accomplishments that we're proud of

- A complete rescue story that never shows more than one instruction.
- Rate feedback that is calm and instant, from a rolling window instead of single clicks.
- Every done criterion backed by an automated LEAF test.

## What we learned

Designing for panic means taking things away. Every word, color and motion has to earn its place, and the best AR detail is the one attached to exactly where your hands already are.

## What's next for Someone

- Real hand tracking to read each push instead of a pinch.
- A real video-assisted dispatch connection, with the existing captions kept on.
- Recognizing a person on the ground and finding the chest, so the target places itself.

## Medical note

Someone is a design concept and practice tool, not a medical device. CPR circulates blood; an AED shock is what treats the rhythm. Guidance aligns with the published rate of 100 to 120 per minute.

## Built with

`lens-studio`, `typescript`, `spectacles-interaction-kit`, `spectacles-ui-kit`, `leaf`, `clad`, `lens-studio-mcp`, `spatial-audio`
