# Someone

**Be the someone.**

When someone collapses, most people freeze. Someone is a Snap SPECS Lens that guides you through CPR, hands-free, one calm step at a time, with 911 seeing what you see.

Built for the Devpost "Learn AR with SPECS" hackathon. Planned with the Devpost Learn `plan-lens` skill, built with TypeScript through the Lens Studio MCP, and thoroughly tested with Snap's LEAF automated testing framework.

---

## Overview

About 263,700 out-of-hospital cardiac arrests occur each year in the United States, yet only about 42% of victims receive bystander CPR. Every minute of delay decreases survival probability by roughly 10%.

The most common point of failure is not technical knowledge: it is the psychological freeze. Among CPR-trained bystanders who failed to act in an emergency, 37% reported that they simply panicked. Under the bystander effect (Darley and Latane, 1968), people wait for someone else to step forward.

**Someone** transforms frozen bystanders into confident first responders by utilizing all three strengths of smart AR glasses:
1. **View Sharing**: The 911 dispatcher sees through your eyes and provides real-time guidance.
2. **Spatial Anchoring**: A glowing, real-scale chest target and pace ring anchor directly onto the patient's sternum.
3. **Hands-Free Operation**: Rescuers maintain both hands on the patient and eyes forward, eliminating phone handling entirely.

---

## Features

### The Core Rescue Moment
- **Anatomical Chest Target & Sternum Landmark**: Real-size glowing target anchored on the sternum with medical-grade crosshairs and cardinal direction ticks marking the lower-third compression zone.
- **Holographic 3D Hand Placement Guide**: Holographic interlocking hands floating 10 cm above the sternum with guidance label `HEEL ON CENTER - INTERLOCK FINGERS` and dynamic 5 cm press animation.
- **Kinetic Compression Shockwaves**: High-contrast ripple waves that propagate outward across the floor on each compression with rate-graded feedback (mint green: 100 to 120 bpm, amber, coral).
- **Pace Ring & Live Scoring**: Pulses at the guideline tempo of 110 bpm. Every compression (pinch) is evaluated into immediate rate bands: mint green for 100 to 120 bpm ("Good"), amber for slight divergence, and coral red for major divergence ("Faster" / "Slower").
- **Spatial Audio Metronome**: Ticks emitted directly from the 3D position of the chest target to keep rescuer attention centered where their hands are.
- **One-Instruction-at-a-Time UI**: High-contrast, single-card interface with live 911 tele-triage badge (`● LIVE 911 ılı VIEWING`) that eliminates cognitive clutter during high-adrenaline moments.

### Dynamic Patient Physics & Reactivity
- **Rigged Anatomical 3D Human Body**: Replaced primitive block shapes with an official articulated human model (`Body Mesh With Skeleton.lspkg`) configured in a natural supine resuscitation posture with PBR soft shading.
- **Anatomical 4.5 cm Chest Deflection**: The patient's chest and body physically depress by 4.5 cm (AHA guidelines) and elastically recoil on each compression.
- **Shallow Agonal Breathing Simulation**: Subtle chest heave during the initial assessment state.
- **Open-Airway Posture (Head-Tilt / Chin-Lift)**: Head tilts back -22 degrees during CPR to ensure airway alignment.
- **Signs of Life (ROSC Recovery Gasp)**: Patient takes a deep recovery gasp (+2.5 cm chest elevation) when CPR succeeds or paramedics arrive.
- **Real Victim Mode (`realVictimMode: true`)**: Hides the 3D dummy mesh when filming with a real person, projecting all AR overlays directly onto the human actor.

### Crisis Narrative & Extended Practice
- **Check and Call**: Prompted shoulder check ("Tap their shoulder. Are they breathing?"), followed by immediate one-tap 911 dispatch.
- **Glance Placer**: Ergonomic UI positioning that smoothly interpolates between standing assessment and kneeling compression viewpoints.
- **Spatial AED Wayfinding**: Defibrillator unit case with billboard label `[ AED - 40m ]`, pulsing sonar rings, and a 3D directional arrow pointing toward the nearest public AED.
- **Rescuer Swap Guidance**: At 2 minutes (65s in demo mode), prompts switching with a helper before fatigue degrades compression quality.
- **Automated Defibrillation Sequence**: Visual pad placement overlay, "Stand clear" voice cue, simulated shock delivery, and immediate resumption prompt.
- **Continuous CPR Practice Mode**: Accessible via the Replay UI ("Practice CPR") for continuous cadence training without time limits.
- **Replay Summary**: Displays total compressions, percentage on-pace, longest streak, and time to first compression, concluding with: *You did not freeze.*

---

## LEAF Integration Test Suite

The project includes five end-to-end integration tests authored using Snap's LEAF (Lens Automation Framework), verifying all five approved design brief done criteria:

| Criterion | Description | Test Scenario | Status |
|---|---|---|---|
| **Criterion 1** | Pinching chest target initiates compressions; pace ring appears centered on chest | `DoneCriterion1Scenario.ts` | **PASSED** |
| **Criterion 2** | Steady compressions at 100 to 120 bpm grade mint green; deviations display "Faster" or "Slower" | `DoneCriterion2Scenario.ts` | **PASSED** |
| **Criterion 3** | Exactly one instruction card is visible at any instant across the entire flow | `DoneCriterion3Scenario.ts` | **PASSED** |
| **Criterion 4** | AED directional arrow and chime trigger at designated elapsed time; "Sent" dismisses both | `DoneCriterion4Scenario.ts` | **PASSED** |
| **Criterion 5** | Replay panel displays accurate compression count and calculated on-pace percentage | `DoneCriterion5Scenario.ts` | **PASSED** |

---

## Technical Architecture

- **Platform**: Lens Studio 5.24+ targeting Snap SPECS.
- **Language**: TypeScript with strict component lifecycle management.
- **Interactions**: Spectacles Interaction Kit (SIK) 2.0.0 and UI Kit 2.0.0.
- **State Machine**: Centralized rescue state machine (`SomeoneRescueStateMachine`) managing strict transitions, queued crisis overlays, and event dispatching.
- **Display Optimization**: Optimized specifically for optical see-through additive displays (pure black renders transparent; high-visibility palette: coral `#FF5A4E`, mint `#5CF2B5`, amber `#FFC24D`, warm white `#F7F5F2`).

---

## Stand-ins and Disclosures

- **Virtual Figure**: In the Lens Studio interactive preview, an articulated 3D human body mesh serves as a stand-in for the real-world victim.
- **Mouse Pinching**: In preview, mouse clicks emulate natural two-finger pinches via SIK MouseInteractor.
- **Dispatcher Audio**: Synthesized audio tracks and captions act as stand-ins for live 911 WebRTC dispatch.
- **Pre-Existing Packages**: SIK 2.0.0, Spectacles UI Kit 2.0.0, and Snap LEAF testing packages are standard official Snap dependencies.

---

## Repository Layout

```
Someone/
├── CLAUDE.md                    # Project memory, rules, and decision log
├── README.md                    # Project documentation
├── devpost/                     # Devpost submission materials
│   ├── design-brief.md          # Approved plan-lens design brief
│   ├── devpost-submission.md    # Hackathon submission text
│   └── video-capture-plan.md    # Shot-by-shot storyboard and filming blueprint
├── handoff.md                   # Session handoff for next agent
└── Someone/                     # Lens Studio project root
    ├── Someone.esproj           # Lens Studio project configuration
    ├── Assets/
    │   ├── GeneratedSFX/        # Metronome and spatial audio assets
    │   ├── Materials/           # Unlit and PBR materials
    │   ├── Meshes/              # Procedural geometric meshes
    │   ├── Scripts/             # TypeScript runtime controllers
    │   │   ├── Tests/           # LEAF automated test scenarios
    │   │   └── ...
    │   └── Scene.scene          # Scene graph hierarchy
    └── Packages/                # SIK, UI Kit, LEAF, and Body Mesh packages
```

---

## Medical Disclaimer

Someone is a concept demonstration and practice tool designed to study how spatial augmented reality reduces bystander hesitation during sudden cardiac arrest. It is not an FDA-cleared medical device and should not replace certified CPR/AED training from accredited organizations such as the American Heart Association (AHA) or Red Cross.
