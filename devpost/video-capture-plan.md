# Someone - Hackathon Video Production & Capture Plan

This document details the complete end-to-end plan to shoot, composite, and edit the final video submission for **Someone: Spatial Cardiac Arrest Tele-Triage for Snap Spectacles**.

---

## 1. Executive Summary & Objective

- **Target Duration:** 2 minutes 30 seconds (optimal for Devpost review).
- **Core Narrative:** A bystander with zero medical training encounters a sudden cardiac arrest and uses Snap Spectacles to transform into an effective, confident first responder before EMS arrives.
- **Production Technique:** Combination of **Third-Person Cinematic Footage** (establishing context) and **First-Person Spectacles POV** (filmed on phone and composited inside Lens Studio with `realVictimMode`).

---

## 2. Pre-Production Checklist

### Equipment
- **Smartphone:** iPhone or Android capable of 1080p or 4K at 60 fps (or 30 fps).
- **Audio:** Built-in phone mic or lapel mic for real-world dialogue; metronome & dispatcher audio exported directly from Lens Studio.
- **Screen Recording:** Windows Game Bar (`Win + Alt + R`) or OBS Studio for clean 60 fps capture of Lens Studio Preview.
- **Video Editor:** CapCut, DaVinci Resolve, or Adobe Premiere (free versions are completely sufficient).

### Roles
1. **Rescuer (Camera Operator):** Holds phone at upper chest / chin level to simulate Spectacles POV, brings hands into frame for shoulder taps and CPR compressions.
2. **Victim (Actor):** Lies motionless flat on back (supine) on an open floor, carpet, or outdoor grass/pavement.
3. **Optional Third Person:** Records third-person contextual shots from a wide angle.

---

## 3. Shot-by-Shot Storyboard

```
[0:00 - 0:25] The Problem & Collapse (Third-Person + POV)
  │
[0:25 - 0:45] Assessment & 911 Tele-Triage Connection (POV)
  │
[0:45 - 1:30] Hand Placement & Continuous CPR Cadence (Picture-in-Picture)
  │
[1:30 - 2:00] Spatial AED Wayfinding & Shock Delivery (POV)
  │
[2:00 - 2:30] ROSC Signs of Life & Impact Summary (Wide + Stats)
```

### Scene 1: The Crisis (0:00 - 0:25)
- **Visual:** A hallway, living room, or outdoor park. A person suddenly clutches their chest and collapses to the floor. A bystander rushes over looking panicked.
- **Voiceover / Caption:** *"Sudden cardiac arrest kills 350,000 people annually in the US alone. 70% happen in homes or public spaces. Most bystanders freeze because they lack confidence."*
- **Camera:** Cuts to rescuer putting on Spectacles (or looking down at the victim).

### Scene 2: Spatial Perimeter & Assessment (0:25 - 0:45)
- **Visual (First-Person POV):** 
  - The rescuer kneels beside the victim.
  - The **360° Rescue Zone perimeter** (`[ RESCUE ZONE - MAINTAIN 360 CLEAR AREA ]`) illuminates on the floor around the victim's body.
  - Rescuer reaches hands out and firmly taps the victim's shoulders: *"Are you okay? Can you hear me?!"*
  - Floating card: `Check response and breathing`.
  - Rescuer pinches card: `No breathing, start CPR`.
- **Audio:** Click confirmation sound; tele-triage connection chime.

### Scene 3: Tele-Triage & Holographic Hand Guide (0:45 - 1:05)
- **Visual (First-Person POV):**
  - **911 Tele-Triage badge** flashes green (`● LIVE 911 ılı VIEWING`).
  - Dispatcher caption appears: *"911 Dispatcher: EMS en route. Place both hands in the center of the chest."*
  - **Holographic 3D Interlocking Hands** float 10 cm above the victim's sternum with label `HEEL ON CENTER - INTERLOCK FINGERS`.
  - Rescuer brings their real hands into frame and matches the exact posture over the victim's chest.

### Scene 4: Cadence Practice & Compression Feedback (1:05 - 1:45)
- **Visual (Split-Screen / Picture-in-Picture):**
  - **Main View (POV):** **Sternum crosshair** with cardinal ticks marks the lower third of the chest. Rescuer performs rhythmic compressions.
  - **Kinetic Shockwaves:** Dynamic mint shockwaves expand across the floor on each compression.
  - **Spatial Metronome & Pace Ring:** 110 bpm audio pulses; rate feedback turns bright mint (`PERFECT PACE: 110 BPM`).
  - **Corner Box (Third-Person):** Shows the rescuer physically pushing down on rhythm.
- **Audio:** Crisp 110 bpm metronome clicks + dispatcher encouragement: *"Good depth, keep this exact rhythm!"*

### Scene 5: Spatial AED Wayfinding & Rescue (1:45 - 2:10)
- **Visual (First-Person POV):**
  - A flashing cyan 3D beacon appears in the distance (`[ AED - 40m ]`) with expanding sonar rings.
  - A 3D edge arrow points the rescuer's gaze toward the AED unit.
  - Defibrillator pads overlay on the victim's right upper chest and left ribs.
  - `STAND CLEAR - SHOCK IN 3... 2... 1...` -> Shock pulse visual wave.
- **Victim Reaction:** Deep recovery gasp (+2.5 cm chest rise) as heart rate stabilizes.

### Scene 6: Session Replay & Value Summary (2:10 - 2:30)
- **Visual:**
  - **Replay HUD:** Displays total compressions (e.g., `84 compressions`), `% On-Pace (95%)`, and emergency elapsed time (`01:42`).
  - Bystander smiles with relief as paramedics arrive.
  - Title Card: **Someone - When every second counts, anyone can be someone.**

---

## 4. Lens Studio Video Integration Steps

To composite your real footage into the Lens Studio simulation:

1. **Record the Video on Phone:**
   - 1080p or 4K at 60 fps, **Horizontal Landscape (16:9)**.
   - Walk up, kneel down, tap shoulders, position hands, and compress at ~110 bpm for 45-60 seconds.
   - Save file as `rescue_raw.mp4`.
2. **Transfer to PC:**
   - Place `rescue_raw.mp4` into `C:/Users/Shawki/Desktop/Specs/Someone/`.
3. **Load into Lens Studio Preview:**
   - In Lens Studio, locate the **Preview** panel.
   - Click the input dropdown (top left of the Preview panel) -> select **From File...** -> choose `rescue_raw.mp4`.
   - Set device to **SPECS 27**.
4. **Configure Settings in Inspector:**
   - Select `SomeoneExperience` in the Objects hierarchy.
   - In Inspector:
     - Check `realVictimMode = true` (hides 3D dummy mesh so AR overlays sit directly on your real friend).
     - Check `demoMode = true` (uses expedited timers for smooth pacing).
5. **Record Clean Footage:**
   - Press `Win + Alt + R` (Windows Game Bar) or use OBS Studio to record the Preview panel in full HD.

---

## 5. Alternative: Built-In 3D Environments (Zero External Filming)

If filming outdoors is not feasible, use the verified built-in 3D simulation:
1. Preview panel dropdown -> **Interactive** -> **Colorful Home** or **Sunlit Room**.
2. Set device to **SPECS 27**.
3. Leave `realVictimMode = false` so the newly integrated rigged anatomical 3D human body mesh is displayed.
4. Record the interactive walkthrough using WASD and mouse navigation.

---

## 6. Video Editing Blueprint (Final Assembly)

| Track | Content |
| :--- | :--- |
| **Video Track 1 (Base)** | First-Person POV capture from Lens Studio (real room video + AR overlays). |
| **Video Track 2 (Overlay)** | Picture-in-picture box (bottom right) showing third-person wide angle of the actor and rescuer. |
| **Audio Track 1** | Voiceover narration explaining the clinical rationale and Spectacles features. |
| **Audio Track 2** | In-engine audio (110 bpm metronome, button clicks, shock cues). |
| **Audio Track 3** | Subtle dramatic ambient background music (ducked under voiceover). |

---

## 7. Submission Checklist Before Uploading

- [ ] Video exported in 1080p 60fps (MP4, H.264).
- [ ] Total duration between 2:00 and 2:45.
- [ ] Demonstrates hand-tracking / pinch interactions.
- [ ] Shows spatial audio and metronome pacing clearly.
- [ ] Uploaded to YouTube as Unlisted/Public and URL pasted into Devpost.
