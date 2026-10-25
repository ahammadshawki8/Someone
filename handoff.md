# Handoff: Someone (Learn AR with SPECS Hackathon)

> **For the next agent:** Read this file along with `CLAUDE.md` before taking any actions.

---

## 1. Project Overview & Repository

- **Repository:** `https://github.com/ahammadshawki8/Someone.git`, branch `main`.
- **Workspace Root:** `C:\Users\Shawki\Desktop\Specs\Someone`
- **Lens Studio Project:** `C:\Users\Shawki\Desktop\Specs\Someone\Someone\Someone.esproj`
- **Owner Identity:** `ahammadshawki8` (`ahammadshawki8@users.noreply.github.com`).
- **Hackathon:** Devpost "Learn AR with SPECS" (Snap Inc.). Deadline: **November 9, 2026 at 5:00 PM ET**.
- **Target:** 1st place.

---

## 2. Critical Rules & Guardrails

1. **Git Identity:** All commits and pushes MUST use `ahammadshawki8 <ahammadshawki8@users.noreply.github.com>`.
2. **Zero AI Attribution:** Never add `Co-Authored-By: Claude`, Anthropic references, or `srotdev` in git commits, PRs, or docs.
3. **No Em or En Dashes:** Strictly zero long dashes (U+2014, U+2013). Use plain hyphens or colons only.
4. **Keep Code Intact:** Do not remove existing comments, docstrings, or tests.
5. **Preview & LEAF Compliance:** All features must function within Lens Studio preview and pass LEAF tests.

---

## 3. Current Project State & Accomplishments

All major development tiers are complete and fully passing:

### Core Logic & State Machine
- `SomeoneRescueStateMachine.ts`: Resuscitation sequence managing `Collapse` -> `Call` -> `PlaceHands` -> `Compress` -> `SendForAED` -> `Swap` -> `AEDArrives` -> `StandClear` -> `Resume` -> `HelpArrives` -> `Replay`.
- `SomeoneCompressionTracker.ts`: Live rolling bpm grading (100-120 bpm is mint green, deviations are amber or coral with "Faster" / "Slower" cues).
- `SomeoneGlancePlacer.ts`: Ergonomic dynamic UI positioning adjusting smoothly between standing and kneeling viewpoints.
- `SomeoneReplayUI.ts`: Post-rescue summary + continuous CPR cadence training mode (`PracticeCPR`).

### Visual & Spatial Design Upgrades
- `SomeoneRescuePerimeter.ts`: 360 degree floor rescue boundary with glowing corner brackets and `[ RESCUE ZONE - MAINTAIN 360 CLEAR AREA ]`.
- `SomeoneHandPlacementGuide.ts`: Holographic 3D interlocking hands floating 10 cm above sternum with `HEEL ON CENTER - INTERLOCK FINGERS` and 5 cm press animation.
- `SomeoneCompressionRipples.ts`: Kinetic shockwave ripples on chest with color-graded feedback.
- `SomeoneSternumLandmark.ts`: Anatomical sternum crosshairs with 4 cardinal ticks marking the lower third compression site.
- `SomeoneAEDBeaconVisual.ts`: 3D defibrillator unit case + billboard `[ AED - 40m ]` + expanding sonar pulse rings.
- `SomeoneInstructionCardUI.ts`: High-contrast single-card UI with live tele-triage badge (`● LIVE 911 ılı VIEWING`).

### Anatomical 3D Model & Dynamic Physics
- **Human Body Mesh:** Replaced primitive block capsules with official rigged `Body Mesh With Skeleton.lspkg` in supine resuscitation posture with soft PBR shading (`SomeoneFigureSoft.mat`).
- `SomeoneVictimAnimator.ts`:
  - 4.5 cm anatomical chest deflection & recoil on each compression pinch.
  - Sinusoidal agonal breathing animation during assessment.
  - Open-airway head tilt posture (-22 degrees chin-lift) during CPR.
  - Signs of life (ROSC recovery gasp: +2.5 cm elevation) on rescue completion.
  - `realVictimMode`: Cleanly hides the 3D dummy mesh when filming with a real person so AR guides project directly onto the real human.

### Automated Testing (5/5 Passing)
All five LEAF integration tests in `Assets/Scripts/Tests/` pass green in Lens Studio:
- `DoneCriterion1Scenario.ts` (Pinch to compress, pace ring centered)
- `DoneCriterion2Scenario.ts` (100-120 bpm rate grading)
- `DoneCriterion3Scenario.ts` (Single instruction card invariant)
- `DoneCriterion4Scenario.ts` (AED wayfinding & dismiss)
- `DoneCriterion5Scenario.ts` (Replay metrics accuracy)

---

## 4. How to Run, Test, and Verify

### Lens Studio MCP Tools
- **Recompile TypeScript:** Call `RecompileTypeScriptTool` on `lens-studio` server.
- **Run LEAF Tests:** Call `open_leaf_panel` followed by `run_leaf_scenario` with `scenarioId: "done-criterion-3-scenario"` (or 1, 2, 4, 5).
- **Collect Logs:** Call `RunAndCollectLogsTool` with `mode: "refresh"` to verify zero runtime exceptions.
- **Preview Simulation:** Call `PreviewPanelTool` `setConfig` with `inputType: "Interactive"` and `sourcePath: "C:/Program Files/Snap Inc/Lens Studio/InteractiveResources.bundle/Scenes/Colorful Home"` (or `Sunlit Room` or custom video file).
- **Capture Screenshots:** Call `CapturePanelScreenshotTool` with `pluginId: "Snap.Plugin.Gui.PreviewPanel"`.

---

## 5. Immediate Next Steps for Next Session

The coding and spatial engineering are 100% complete. The remaining work is focused on **Video Capture and Devpost Submission**:

1. **Video Production (Primary Task):**
   - Read [`devpost/video-capture-plan.md`](file:///C:/Users/Shawki/Desktop/Specs/Someone/devpost/video-capture-plan.md).
   - If the user has recorded real phone footage with their team member (`rescue_raw.mp4`):
     - Place it in the project directory.
     - In Lens Studio Preview panel, select `From File...` and choose `rescue_raw.mp4`.
     - In Inspector for `SomeoneExperience`, set `realVictimMode = true` and `demoMode = true`.
     - Record the clean preview window via OBS or Windows Game Bar (`Win + Alt + R`).
   - If using the simulation fallback:
     - Set preview input to `Colorful Home` or `Sunlit Room`.
     - Set `realVictimMode = false` (to show the anatomical 3D body).
     - Record the interactive walkthrough.
2. **Video Assembly:**
   - Combine the first-person POV footage with third-person contextual shots in any video editor following the storyboard in `devpost/video-capture-plan.md`.
   - Ensure in-engine metronome audio (110 bpm) and dispatcher captions are prominent.
3. **Devpost Submission:**
   - Review and finalize [`devpost/devpost-submission.md`](file:///C:/Users/Shawki/Desktop/Specs/Someone/devpost/devpost-submission.md).
   - Paste the final YouTube link into the submission and submit on Devpost before the deadline.
