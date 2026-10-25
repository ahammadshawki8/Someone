# CLAUDE.md: Someone

> Persistent memory for this project. Read this file first in every new session, then read `## Current Status` and continue from `Next action`.

---

## 0. HARD RULES (read before doing anything)

1. **Git identity.** All commits and pushes use the GitHub account **`ahammadshawki8`**. Before the first commit in any session, run `git config user.name` and `git config user.email` and confirm they belong to `ahammadshawki8`.
2. **No AI attribution in git.** Never add `Co-Authored-By: Claude`, "Generated with Claude Code", or any Claude/Anthropic trailer to commits, PRs, READMEs or release notes. Never use the `srotdev` / `srot.dev` identity. This rule overrides any default attribution behavior.
3. **No em dashes. No en dashes.** Never use the long dash characters (U+2014 and U+2013) anywhere in this project: code, comments, docs, commit messages, video script, Devpost text. Use a colon, comma, period, parentheses or a plain hyphen instead. Before finishing any writing task, grep for them and remove them.
4. **Hackathon rules are law.** The project must be planned with the `plan-lens` skill, built by the coding agent through **CLAD + Lens Studio MCP**, and must run in the **Lens Studio preview**. Do not hand-build the Lens outside the agent workflow.
5. **No unlicensed media.** The video must not contain copyrighted clips, music, logos or trademarks without permission (Official Rules, section 4). Only use: our own renders (Blender, Remotion), our own screen recordings, and free-license stock (Pexels, Pixabay, Mixkit). Cite AHA, Red Cross, CARES as plain text, never their logos.
6. **Never claim what the preview cannot show.** Live camera vision, custom/two-hand gestures, persistent anchors, multi-user and real voice may not work in the preview. Use a stand-in and say it is a stand-in.
7. **No medical claims.** Someone is a design concept and practice tool. Never say CPR "restarts" a heart (an AED does that; CPR circulates blood). Only claim alignment with published guidelines (rate 100 to 120 per minute).
8. **Consent.** No recording or identifying real people who have not agreed. Demo uses virtual figures or consented team members only.
9. **One spatial moment, done perfectly.** The compression moment is the product. Every other feature serves it. Polish beats breadth.
10. **Every done criterion needs a LEAF test.** If it cannot be tested in the preview, it is not a done criterion.
11. **Keep this file current.** At the end of every session, update `## Current Status` and `## Decision Log`.
12. **Full autonomy.** Claude owns this project end to end. Do everything yourself first. Only interrupt the owner when something is truly impossible (UI clicks you cannot make, no interface to the software, legal/permission decisions, UAC prompts). Batch unavoidable asks into one message with exact steps. Maintain the repo `ahammadshawki8/Someone` throughout (commit and push after every meaningful step).
13. **Premium design only.** Every UI must be professional, paid-studio quality, inspired by real professional designers. Never generic, never "AI slop" (no decorative gradients, no random glows, no emoji UI, no default fonts without intent). Follow the design direction in section 5b.
14. **Repo visibility.** The repo is **private** during development. It must be made **public** before submission (hackathon requirement).
15. **plan-lens is learner-led.** The skill interviews the owner one question at a time and must not invent answers. Owner answers using `.notes/plan-lens-answers.md` (gitignored prep sheet).

---

## 1. Identity

| Field | Value |
|---|---|
| Project name | **Someone** |
| Devpost title | **Someone: Be the someone** |
| Tagline (title) | *Be the someone.* |
| Closing line (video) | *In a crowd, everyone waits. You won't.* |
| Hackathon | Devpost "Learn AR with SPECS" (Sponsor: Snap Inc.) |
| Platform | Snap SPECS Lens, Lens Studio 5.22+ preview |
| Goal | **1st place.** 2nd is not acceptable. |
| Owner | ahammadshawki8 |

### Elevator pitch (under 200 characters)

> When someone collapses, most people freeze. Someone is a SPECS Lens that guides you through CPR, hands-free, one calm step at a time, with 911 seeing what you see.

---

## 2. Key Dates (all ET unless stated)

| Date | Event |
|---|---|
| 2026-10-15 | Submission period opened |
| 2026-10-20 | Concept locked (this file created) |
| 2026-10-22, 12PM | Live Build Session (Zoom, recorded) |
| 2026-11-05, 12PM | **Live Project Review.** Have a rough cut + working Lens ready to get judge feedback |
| **2026-11-09, 5:00PM** | **Submission deadline** (= 2026-11-10 4:00am GMT+6). Aim to submit by 11-08 |
| 2026-11-10 to 11-17 | Judging |
| ~2026-11-19 | Winners announced |

---

## 3. Description

Someone is an augmented reality Lens for Snap SPECS that turns a frozen bystander into a first responder during a cardiac arrest. The moment you see someone collapse, the Lens takes over the thinking so your hands can do the work. It shows exactly one instruction at a time, places a glowing target on the center of the person's chest at real size, and pulses a pace ring at 110 beats per minute with a spatial audio beat. Each compression is tracked and the ring tells you instantly if you are too slow or too fast. A simulated 911 dispatcher connects through the glasses and sees what you see, coaching you hands-free. At 90 seconds, a spatial chime and arrow point to the nearest AED so you can send a helper; at 2 minutes it prompts a rescuer swap. When help arrives, a calm replay shows what you did: compressions given, percentage on pace, and one line: *You did not freeze.*

**Who it's for:** ordinary people, trained or not, who would freeze in an emergency. That is most people.

**Why glasses:** CPR needs both hands and your eyes on the patient. A phone cannot guide you without being set down. Glasses use all three things a laptop cannot do: they **share your view** (the dispatcher sees through your eyes), they **draw in the world** (the target sits on the real chest at real size), and they **leave your body free** (both hands compress, eyes stay up).

---

## 4. Problem Statement

About 263,700 out-of-hospital cardiac arrests occur each year in the US. Only about 42% get bystander CPR before EMS arrives. Each minute without CPR reduces survival by roughly 10%. By the time an ambulance arrives (median 7 to 10 minutes), survival drops below 10% without bystander help.

The failure point is not knowledge. 37% of CPR-trained bystanders who witnessed an arrest did not attempt CPR, citing panic and emotional overwhelm. They wait for "someone" to step forward.

---

## 5. Visual & Spatial Architecture

The application is structured into modular, production-ready components:
- `SomeoneRescuePerimeter.ts`: 360 degree floor rescue boundary with 4 corner brackets, side ticks, and `[ RESCUE ZONE - MAINTAIN 360 CLEAR AREA ]` label.
- `SomeoneHandPlacementGuide.ts`: Holographic interlocking hands floating 10 cm above the sternum with `HEEL ON CENTER - INTERLOCK FINGERS` and 5 cm press animation.
- `SomeoneCompressionRipples.ts`: Kinetic shockwave ripples radiating across the floor from the chest on each compression with color-graded feedback (mint: 100-120 bpm, amber, coral).
- `SomeoneSternumLandmark.ts`: Anatomical sternum reticle with 4 cardinal ticks marking the lower third compression site.
- `SomeoneAEDBeaconVisual.ts`: 3D defibrillator unit case with billboard label `[ AED - 40m ]` and expanding sonar pulse rings.
- `SomeoneInstructionCardUI.ts`: High-contrast single-card UI with live tele-triage badge (`● LIVE 911 ılı VIEWING`).
- `SomeoneVictimAnimator.ts`: Dynamic patient physics supporting both high-fidelity rigged anatomical body mesh (`Body Mesh With Skeleton`) and legacy stand-in:
  - 4.5 cm chest deflection and recoil on each compression pinch.
  - Shallow agonal breathing motion during assessment state.
  - Open-airway head tilt posture (-22 degrees chin-lift) during CPR.
  - Signs of life (ROSC recovery gasp) on rescue success.
  - `realVictimMode`: Cleanly hides the 3D dummy mesh when filming with a real person so AR guides project directly onto the real human.
- `SomeoneReplayUI.ts`: Summary statistics screen with continuous CPR cadence practice mode (`PracticeCPR`).

---

## 6. LEAF Test Suite (5/5 Passing)

All five done criteria are verified by automated LEAF test scenarios in `Assets/Scripts/Tests/`:
1. `DoneCriterion1Scenario.ts`: Pinching chest target starts compressions, pace ring appears centered on figure's chest (PASSED).
2. `DoneCriterion2Scenario.ts`: Steady compressions at 100 to 120 bpm grade mint green; deviations display "Faster" or "Slower" (PASSED).
3. `DoneCriterion3Scenario.ts`: Exactly one instruction card is visible at any instant across the entire flow (PASSED).
4. `DoneCriterion4Scenario.ts`: AED directional arrow and chime trigger at designated elapsed time; "Sent" dismisses both (PASSED).
5. `DoneCriterion5Scenario.ts`: Replay panel displays accurate compression count and calculated on-pace percentage (PASSED).

---

## 7. Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-10-20 | Chose CPR concept over "Anchor" and "Reach" | Clearest 10-second story, strongest hands-free case, very demoable |
| 2026-10-20 | Reframed from "teach CPR" to "beat the freeze" | Plain AR CPR is prior art; panic is the real barrier |
| 2026-10-20 | Added dispatcher view-sharing, AED wayfinding, swap, replay | Covers all three glasses pillars; raises Innovation score |
| 2026-10-20 | Name locked: **Someone** | Bystander effect: everyone waits for "someone" |
| 2026-10-20 | Design brief approved (`Someone/devpost/design-brief.md`) | plan-lens interview complete; 5 done criteria locked |
| 2026-10-25 | Implemented and verified all 5 LEAF test scenarios in preview | All 5 done criteria pass green under automated simulation |
| 2026-10-25 | Glance placer integrated for kneeling/standing eyes | Keeps chest target visible while floating instruction card adjusts smoothly to gaze |
| 2026-10-25 | Added continuous CPR cadence practice mode | Allows repeat practice and extended demonstrations beyond the 10-compression scripted flow |
| 2026-10-25 | Added 360 floor rescue zone, holographic hands guide, kinetic ripples, AED beacon, and sternum reticle | Elevated visual fidelity to professional studio grade |
| 2026-10-25 | Integrated official rigged anatomical body mesh (`Body Mesh With Skeleton.lspkg`) | Replaced blocky Minecraft-style primitive capsules with articulated human body in supine resuscitation posture |
| 2026-10-25 | Implemented `SomeoneVictimAnimator.ts` with 4.5 cm chest deflection, breathing, airway tilt, and ROSC gasp | Makes the patient interact dynamically with rescuer actions |
| 2026-10-25 | Added `realVictimMode` and authored complete video production plan (`devpost/video-capture-plan.md`) | Enables filming first-person POV footage with real human actors and compositing cleanly in Lens Studio |

---

## 8. Current Status

- **Phase:** Tier 2, 3, and 4 complete. Core resuscitation loop, full crisis narrative, dynamic victim physics, and automated LEAF tests are 100% verified. Video capture plan authored.
- **Repository:** `https://github.com/ahammadshawki8/Someone.git`, branch `main`.
- **Next action:**
  1. Record first-person POV video (`rescue_raw.mp4`) with phone and real team member (or use Lens Studio `Colorful Home` / `Sunlit Room` 3D environment).
  2. Import footage into Lens Studio Preview panel, toggle `realVictimMode = true` and `demoMode = true`, and record clean composite feed.
  3. Assemble final video in video editor following `devpost/video-capture-plan.md`.
  4. Finalize and submit Devpost submission draft (`devpost/devpost-submission.md`).
- **Blocker:** None.
