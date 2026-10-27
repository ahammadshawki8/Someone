# Someone: Be the someone

## Elevator pitch (under 200 characters)

When someone collapses, most people freeze. Someone is a SPECS Lens that guides you through CPR, hands-free, one calm step at a time, with 911 seeing what you see.

---

## Inspiration

About 263,700 EMS-treated cardiac arrests happen outside hospitals in the US each year. Only about 42% of patients get CPR from a bystander, and survival falls by roughly 10% for every minute without CPR and defibrillation.

The barrier is rarely knowledge. Of CPR-trained bystanders who did not help, 37% said they simply panicked (Swor et al., 2006). And the more people present, the less likely any one of them acts: the bystander effect. Everyone waits for "someone".

Existing AR CPR projects grade technique on a mannequin in a classroom. Nobody designs for the freeze. We asked: what if your glasses took over the thinking for those first seconds, so your hands could do the work?

## What it does

Someone is one spatial moment, done carefully. You kneel by the person. A target glows on the center of their chest at real size, and a ring around it pulses at 110 per minute with a soft beat that comes from the chest itself. Your hands push on the chest; on glasses, hand tracking counts each stroke. Every push is scored: the ring turns mint between 100 and 120 per minute and says "Faster." or "Slower." when you drift.

Around that moment, a short story keeps you moving, one instruction at a time:

- **Check and call.** "Tap their shoulder. Are they breathing?" Then one big "Call 911" button.
- **The dispatcher sees what you see.** A badge reads "Dispatcher connected, viewing" and a calm scripted voice coaches you, with captions for every line.
- **AED wayfinding, against the bystander effect.** At 1:30 a chime comes from one side and an amber chevron points out of view: "AED, 40 m. Point at one person." The dispatcher: "Don't ask the crowd. Point at one person and say: you, get the AED." A crowd asked to "send someone" waits; one named person moves.
- **Rescuer swap.** At 2:00: "Switch with a helper if you can." Scoring pauses for the handoff.
- **The AED.** Pads appear on the chest, "Stand clear.", the AED delivers a simulated shock, and you resume.
- **Replay.** When help arrives, one line first: *You did not freeze.* Then four numbers: compressions, % on pace, best streak, time to first push.

## Why it belongs on glasses

CPR needs both hands and your eyes on the person. A phone has to be put down, and then it cannot guide you. Someone uses all three strengths of glasses: it **leaves your body free**, it **draws in the world** (the guide sits on the chest where your hands go), and it **shares your view** (the dispatcher sees through your eyes).

## Design

- **One instruction at a time.** Panic shrinks attention, so only one card is ever visible. Timed prompts that fire while you owe a pinch wait in line behind it.
- **Attached to the task.** Target and ring on the sternum of a real-scale sculpted manikin, the card 30 cm above the chest so words and hands share one glance, the clock small and low in the view, never in the center. Everything fits the 32 by 37 degree Specs view.
- **Hands push, nothing to hold.** On glasses, tracked palms on the chest count each stroke, and the target brightens when your hands are in place. No pinching mid-CPR.
- **Out of view, but not out of mind.** The AED is behind you, so it gets a directional chime and an edge arrow, not another panel.
- **Built for an additive display.** Black renders transparent on SPECS, so there are no dark panels. Four colors only: coral for the pulse, mint for on pace, amber for caution, warm white for text.
- **Calm motion.** Slow fades. The ring's pulse is the only rhythmic motion in the Lens.

## How we built it

- **Planned with `plan-lens`.** The skill interviewed us one question at a time and produced an approved design brief with five done criteria, each checkable in the preview.
- **Built through CLAD and the Lens Studio MCP.** Claude Code with CLAD wrote every TypeScript component, wired the scene and imported assets through the MCP in Lens Studio 5.24.1. It recompiled, read runtime logs, walked each beat from the user's eye with simulated pinches and screenshots, and fixed what it saw: a pace ring that rendered as a filled disc, a clock outside the view, an AED arrow painted over by the figure, a clipped replay, dispatcher lines cut mid-sentence.
- **Tools, from scripts.** The manikin is modeled in Blender from a script; the ring and chevron are runtime meshes in centimetres; sound effects are synthesized; the dispatcher voice is Kokoro-82M text to speech.
- **Hand-tracked compressions.** A stroke detector reads both tracked palms near the sternum: a 2 cm push counts and a 1.5 cm recoil re-arms, so a resting or trembling hand never counts.
- **One source of truth.** A pure-logic rescue state machine drives every view. A compression tracker computes a rolling rate from the last five intervals; a stats module feeds the replay.
- **Tested with LEAF.** Seven scenarios pass in the preview: one per done criterion (target starts compressions, rate bands, one card at a time, AED prompt and dismissal, replay accuracy), plus hand-tracked strokes and the flow rules (dispatcher never cut or stale, prompts queue behind each other, the swap pauses scoring).
- **Spatial audio.** The metronome plays from the chest position and the AED chime from the AED's direction.

## Stand-ins

The preview cannot recognize a real person, read real hand pushes or place a real call, so:

- A sculpted manikin stands in for the person, and the Lens assumes recognition already happened.
- In the preview the mouse is one pinching hand, so a pinch on the target stands in for a push. On glasses, tracked hands count pushes (logic proven by LEAF and the preview's simulated palm, feel unproven). Depth is never measured or claimed.
- The dispatcher (Kokoro text to speech with captions), the AED, the helper and the shock are scripted.

## Challenges we ran into

- **Additive color.** Without dark panels, readability had to come from light text and luminous shapes over the room.
- **Standing versus kneeling.** The card has to stay in the same glance as the hands at any head height, so it eases between heights instead of sitting at a fixed one.
- **Timers versus pinches.** AED and swap prompts run on the clock but must never stack, which needed a small queue in the state machine.
- **A dispatcher that keeps up.** Queued voice lines were cut mid-sentence, then read after the moment had passed. Now each line finishes, and only the newest waiting line is spoken.
- **Restraint.** We built extra effects along the way (floor perimeter, holographic hands, ripples) and removed them. Each one competed with the single instruction that matters.

## Accomplishments that we're proud of

- A complete rescue story that never shows more than one instruction.
- Rate feedback that is calm and instant, from a rolling window instead of single clicks.
- Every done criterion backed by an automated LEAF test, plus tests for hand tracking and the flow rules.
- CPR counted from the hands that are doing it, not from a pinch.

## What we learned

Designing for panic means taking things away. Every word, color and motion has to earn its place, and the best AR detail is the one attached to exactly where your hands already are.

## What's next for Someone

- Tuning hand-tracked compressions on real Specs hardware.
- A real video-assisted dispatch connection, with the existing captions kept on.
- Recognizing a person on the ground and finding the chest, so the target places itself.

## Medical note

Someone is a design concept and practice tool, not a medical device. CPR circulates blood; an AED shock is what treats the rhythm. Guidance aligns with the published rate of 100 to 120 per minute.

## Built with

`lens-studio`, `typescript`, `blender`, `kokoro-tts`, `spectacles-interaction-kit`, `spectacles-ui-kit`, `leaf`, `clad`, `lens-studio-mcp`, `spatial-audio`
