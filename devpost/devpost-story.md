## Inspiration

**A man collapses on a busy plaza. Forty people see it happen. Forty people look at each other, and every one of them waits for someone else.**

- **The next ten minutes decide everything.** His chance of survival falls by about 10% for every minute without CPR and defibrillation, and help is still minutes away.
- **The problem is not that people don't know CPR.** In a study of 684 cardiac arrest bystanders, the most common reason CPR-trained people did not help was simple: **37.5% said they panicked** (Swor et al., 2006).
- **And crowds make it worse.** Darley and Latané showed in 1968 that the more people who witness an emergency, the less likely any one of them is to act. Everyone is waiting for "someone".
- **So we stopped asking how to teach CPR and asked a different question:** what if, in the exact second you freeze, a calm voice and a clear guide appeared right where your hands need to go?

That is **Someone**: a Snap Specs Lens that turns a frozen bystander into the person who moves first.

![The problem in numbers](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/poster-problem.png)

## What it does

Someone guides you through a cardiac arrest **hands-free, one calm instruction at a time**, with the guide drawn on the person's body instead of a screen.

![Walking up to the person: the Lens marks him from across the plaza](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/gif-walkin.gif)

- **Seen from afar.** A thin coral ring on the ground marks the person from across the plaza, so you know where to go. It fades once your hands are on the chest.
- **Check and call.** "Tap their shoulder. Are they breathing?" Then one large **Call 911** button. No menus, no dashboards.
- **The dispatcher sees what you see.** When 911 connects, mint corners flash around your view and a calm dispatcher voice coaches you, with captions for every line. (Video-guided dispatch is linked to higher survival: 14.3% vs 8.9% with audio alone, Lee et al., 2020.)
- **The core moment: compressions on the chest.**
  - A glowing target sits on the sternum at real size.
  - A pace ring pulses at **110 beats per minute**, with a soft metronome that plays *from the chest itself* (spatial audio).
  - Every push is scored live: the ring turns **mint between 100 and 120 per minute** (the AHA guideline band) and says "Faster." or "Slower." when you drift.
  - The chest gives a little under each push, and one ring ripples out from your hands, coloured by your pace.

![Compressions: the ring turns mint on pace, one ripple per push](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/gif-compress.gif)

- **AED wayfinding, designed against the bystander effect.** At 1:30, a chime comes from the side and an amber chevron points out of view: **"AED, 40 m. Point at one person."** The dispatcher adds: *"Don't ask the crowd. Point at one person and say: you, get the AED."* A crowd asked to "send someone" waits. One named person moves.

![AED wayfinding: a chime, an arrow, and "Point at one person"](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/gif-aed.gif)

- **Rescuer swap.** At 2:00, "Switch with a helper if you can." Guidelines recommend swapping rescuers about every two minutes, so scoring pauses during the handoff.
- **The AED arrives.** Pads appear on the chest, "Stand clear.", a simulated shock, then back to compressions.
- **Replay.** When help arrives, one line comes first: ***You did not freeze.*** Then four numbers count up: compressions, % on pace, best streak, and time to first push.

![Eleven states, one instruction at a time](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/poster-flow.png)

## Why it belongs on glasses

- **It leaves your body free.** CPR takes both hands and your eyes on the person. A phone has to be set down, and then it can't guide you.
- **It draws in the world.** The guide sits on the chest, exactly where your hands go, at real size.
- **It shares your view.** The dispatcher sees through your eyes instead of asking you to describe a scene you can barely process.
- Someone uses **all three strengths of Specs in one moment**, which is something a phone or laptop version simply cannot do.

## Backed by research

Every design decision in Someone traces back to a published finding.

![Every design decision traces back to a study](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/poster-research.png)

- **Panic is the real barrier.** 37.5% of CPR-trained bystanders who did not act said they panicked, and 9.1% feared doing it wrong. So Someone shows **one instruction at a time** with big, simple targets.
- **Crowds diffuse responsibility.** The bystander effect is one of psychology's most replicated findings. So the AED step tells you to **point at one person**, never "send someone".
- **Seeing helps dispatchers.** Video-instructed dispatcher CPR was associated with higher survival to discharge than audio-only. So **the dispatcher sees your view**.
- **Real-time feedback works.** A 2024 systematic review found AR feedback improves CPR performance compared with no feedback. So the **pace ring scores every push**.
- **Every bystander matters.** A 2025 meta-analysis of 253,247 cardiac arrests found bystander CPR significantly raises survival (OR 1.72). So the replay celebrates **time to first push**.
- **Where we fit.** Existing AR CPR work focuses on technique training and object detection (Cheng 2024, Sun 2024, Abo-Zahhad 2025). **Nobody designs for the freeze. Someone does.**

## How we built it

We built Someone the way Snap intended this hackathon to be built: **planned with plan-lens, built by an agent through CLAD and the Lens Studio MCP, and verified with LEAF tests in the preview.**

![Plan, build, run, test](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/poster-pipeline.png)

- **Plan: the plan-lens skill.**
  - A one-question-at-a-time interview checked the idea against AR design rules and preview limits.
  - The output was an approved design brief with **five done criteria**, each testable in the preview.
- **Build: Claude Code with CLAD, through the Lens Studio MCP (Lens Studio 5.24.1).**
  - The agent wrote **29 TypeScript components (about 3,600 lines)**, wired the scene and imported assets.
  - It used `scene-graphql` and `ExecuteEditorCode` for scene edits, then `RecompileTypeScriptTool` and `RunAndCollectLogsTool` after every change.
  - It walked each beat from the user's eye with `PreviewInteractTool`, `MovePreviewCamera` and `CapturePanelScreenshotTool`, and fixed what it saw.
- **Run: the Lens on Specs.**
  - **Spectacles Interaction Kit** supplies tracked palms (for compressions) and pinch (for buttons).
  - **Spectacles UI Kit** draws the instruction card and the replay.
  - **Spatial audio** places the metronome at the chest and the AED chime in its real direction.
  - The ring, chevron, viewfinder corners and ripples are **runtime meshes built in real centimetres**, so everything is true to scale.
- **Test: LEAF.**
  - **Eight scenarios pass** in the preview: one per done criterion, plus hand-tracked strokes, the flow rules, and the full rescue end to end.
  - The same end-to-end scenario drove the footage in our demo video, so what you see is the real Lens running.

![Runtime architecture](https://raw.githubusercontent.com/ahammadshawki8/Someone/main/devpost/media/poster-runtime.png)

- **One source of truth.** A pure-logic `RescueStateMachine` (11 states) drives every view. Views are passive and never decide the flow, which makes the logic directly testable.
- **Real rhythm scoring.** `CompressionTracker` computes a rolling rate over the last 5 push intervals, so one uneven push never flips the feedback. A long pause restarts the window.
- **Hand-tracked compressions.** `StrokeDetector` reads both tracked palms near the sternum. A 2 cm push counts, and a 1.5 cm recoil re-arms it (hysteresis), so a resting or trembling hand never counts. Depth is never claimed.
- **A prompt queue.** Timed prompts (AED at 1:30, swap at 2:00) that fire while you still owe an answer wait in line, so **there is never more than one card on screen**.
- **Assets made from scripts.**
  - **The person:** built in Blender from CC0 MakeHuman assets, with a `Compress` blend shape so the chest gives under each push.
  - **The dispatcher voice:** Kokoro-82M text to speech (Apache 2.0).
  - **Sound effects:** synthesized locally.

## Challenges we ran into

- **Designing for an additive display.** On Specs, black renders transparent, so we could not use dark panels. All readability comes from light text and luminous shapes over the real world, in four colours only.
- **A ring that rendered as a filled disc.** The first pace ring was a torus primitive that showed up as a solid 26 cm coral blob covering the target. We replaced it with a runtime flat ring (0.8 cm line, 11 cm radius).
- **A dispatcher that kept up.** Queued voice lines were cut mid-sentence, then read after the moment had passed. Now each line finishes, and only the newest waiting line is spoken.
- **Timers vs pinches.** The AED and swap prompts run on the clock but must never stack. A small queue in the state machine solved it, and a LEAF test now guards it.
- **Fitting the Specs view.** The view is about 32 by 37 degrees. We moved the clock out of the centre, lowered the replay so its headline stays in view, and kept every element 0.6 to 1.6 m away.
- **Restraint.** We built extra effects (a floor perimeter, holographic hands, constantly pulsing markers) and removed them, because each one competed with the single instruction that matters. What stayed has a job.

## Accomplishments that we're proud of

- **A complete rescue story**, from collapse to replay, that never shows more than one instruction at a time, and a test that proves it.
- **Every done criterion backed by a LEAF test**, plus three more, all **8 of 8 passing**.
- **Rate feedback that feels calm and instant**, from a rolling window instead of single clicks.
- **A bystander-effect insight turned into one line of UI copy:** "Point at one person."
- **The whole Lens built through Snap's agent workflow**, with the agent seeing its own output and fixing it in a loop.
- **A realistic person who reacts:** the chest gives under every push.

## What we learned

- **Designing for panic means taking things away.** Every extra label we tried competed with the one instruction that mattered.
- **On an additive display, contrast means light on the world**, not text on a panel.
- **A rolling rate is the right unit of feedback.** A single interval is too noisy to judge a human rhythm.
- **Agent-built does not mean unchecked.** Pairing CLAD with screenshots and LEAF tests turned "it compiles" into "it works, and here is the proof".
- **Research is a design tool.** Reading the bystander literature changed one sentence in our UI, and that sentence is the heart of the product.

## What's next for Someone

- **From preview to people.** Our next step is to install Someone on real Specs hardware and test it with real users, CPR instructors and emergency dispatchers.
- **Validate the feel, not just the logic.** Hand-tracked compressions are built and tested in logic. Now we want to tune them against real hands on a training manikin.
- **Partner with the people who answer the call.** We want to work with dispatch centres to connect the view-sharing moment to real video-assisted dispatch.
- **Make it live for every Specs user.** Our goal is simple: publish Someone so it is there on every pair of Specs, ready for the one moment it matters. As glasses become all-day devices, a guide like this should be built in before anyone needs it.
- **Idea to reality.** One day, when someone collapses on a busy street, the person wearing Specs will not freeze. They will be the someone who moves first.

## Why Someone should win

- **Design: a complete product, not a tech demo.** One coherent story, one instruction at a time, every element attached to the task, and a calm visual language built for an additive display.
- **Technical: built the way Snap intended.** It used plan-lens, CLAD and the Lens Studio MCP end to end. A clean state machine, real rhythm scoring, hand-tracking with hysteresis and spatial audio, all proven by 8 passing LEAF tests.
- **Innovation: we design for the freeze, not for technique.** Other AR CPR projects grade technique. Someone designs against panic and the bystander effect, using all three glasses strengths in a single moment.
- **Impact: built on research, aimed at a real gap.** Fewer than half of cardiac arrest victims get bystander CPR. If Someone helps even one frozen bystander move, it has done its job.

**In a crowd, everyone waits. Be the someone who moves first.**

## References

1. Swor R, Khan I, Domeier R, Honeycutt L, Chu K, Compton S. CPR training and CPR performance: do CPR-trained bystanders perform CPR? *Acad Emerg Med.* 2006;13(6):596-601. doi:10.1197/j.aem.2005.12.021
2. Darley JM, Latané B. Bystander intervention in emergencies: diffusion of responsibility. *J Pers Soc Psychol.* 1968;8(4):377-383. doi:10.1037/h0025589
3. Lee SY, Song KJ, Shin SD, et al. Comparison of the effects of audio-instructed and video-instructed dispatcher-assisted cardiopulmonary resuscitation on resuscitation outcomes after out-of-hospital cardiac arrest. *Resuscitation.* 2020. doi:10.1016/j.resuscitation.2019.12.004
4. Cheng A, Fijacko N, Lockey A, et al. Use of augmented and virtual reality in resuscitation training: a systematic review. *Resusc Plus.* 2024. doi:10.1016/j.resplu.2024.100643
5. Chen X, Zou Z, Wen X, Li L, Liang Y. The role of bystander cardiopulmonary resuscitation: a meta-analysis. *Emerg Med Int.* 2025. doi:10.1155/emmi/5591055
6. Sun R, Wang Y, Wu Q, et al. Effectiveness of virtual and augmented reality for cardiopulmonary resuscitation training: a systematic review and meta-analysis. *BMC Med Educ.* 2024. doi:10.1186/s12909-024-05720-8
7. Abo-Zahhad M, et al. Development of an AI-powered AR glasses system for real-time first aid guidance in emergency situations. *BioData Min.* 2025. doi:10.1186/s13040-025-00473-6
8. American Heart Association. 2025 Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care (CARES 2024 data: about 263,700 EMS-treated OHCA, 10.5% survival to discharge, 41.7% bystander CPR).
9. American Red Cross. CPR facts and statistics (survival decreases about 10% per minute without CPR and defibrillation).
