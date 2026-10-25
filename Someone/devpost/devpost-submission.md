# Someone: Be the someone

## Elevator Pitch

When someone collapses, most people freeze. Someone is an AR Lens for Snap SPECS that guides you through CPR hands-free, one calm step at a time, with 911 seeing what you see.

---

## Inspiration

About 263,700 out-of-hospital cardiac arrests occur each year in the United States, yet only about 42 percent of victims receive bystander CPR. Survival drops by roughly 10 percent for every single minute CPR and defibrillation are delayed.

The primary barrier is rarely lack of knowledge: it is panic. Among CPR-trained bystanders who failed to act in real emergencies, 37 percent reported that they simply froze. In social psychology, this is known as the bystander effect (Darley and Latane, 1968): the more bystanders present, the less likely any single individual is to step forward. Everyone waits for "someone" to take charge.

Existing augmented reality CPR projects focus predominantly on technique grading or mannequin telemetry in classroom settings. Nobody designs for the initial psychological freeze.

We built **Someone** to answer a simple question: What if your glasses took over the thinking in that critical first moment, so your hands could do the work?

---

## What It Does

Someone turns an ordinary bystander into an active first responder:

1. **Step-by-Step Emergency Flow**: Guides the user through shoulder check ("Tap their shoulder. Are they breathing?"), calling 911, hand placement, and rhythmic chest compressions.
2. **Real-Scale Chest Target**: Anchors a glowing hand-placement target directly on the victim's sternum at anatomically correct size.
3. **Pacing and Live Scoring**: A pace ring pulses at the guideline-recommended 110 bpm, accompanied by a spatial audio metronome positioned at the chest. Compressions are scored dynamically into rate bands: mint green for 100 to 120 bpm ("Good"), amber for slight divergence, and coral red for significant divergence ("Faster" or "Slower").
4. **Dispatcher View-Sharing**: A simulated 911 dispatcher connects directly into the glasses view, providing scripted audio cues and live reassurance while seeing the user's field of view hands-free.
5. **One-Instruction-at-a-Time UI**: To avoid cognitive overload during acute panic, exactly one high-contrast instruction card is visible at any instant.
6. **Glance Placement**: Floating cards dynamically adjust position between standing and kneeling viewpoints so the user never has to look away from the patient.
7. **AED Wayfinding and Rescuer Swap**: At 90 seconds (or 45s in demo mode), a spatial chime and 3D floating arrow indicate the nearest AED ("AED, 40 m. Send someone."). At 2 minutes (or 65s in demo mode), it prompts a rescuer swap ("Switch with a helper if you can.") to prevent physical exhaustion.
8. **Automated Defibrillation Simulation**: Overlays pad placement targets on the virtual figure, prompts "Stand clear," simulates the shock delivery, and directs immediate resumption of compressions.
9. **Replay Summary**: Concludes with a calm performance debrief displaying total compressions, on-pace percentage, longest streak, and time to first compression, anchored by one clear reminder: *You did not freeze.*

---

## How We Built It

- **Lens Studio & TypeScript**: Developed as a native Lens Studio 5.24+ project targeting Snap SPECS with full TypeScript architecture.
- **Spectacles Interaction Kit (SIK)**: Utilized SIK and UI Kit for spatial interactions, raycasting, pinch events, and visual components.
- **State Machine Architecture**: A centralized rescue state machine (`SomeoneRescueStateMachine`) coordinates strict state transitions, overlay prompts, timed queues, and event streams.
- **Glance Placer**: Built `SomeoneGlancePlacer` using smooth damped interpolation to position floating cards comfortably within the user's field of view without obstructing the physical chest target.
- **LEAF Testing Suite**: Integrated Snap's LEAF (Lens Automation Framework) to author 5 rigorous automated integration test scenarios, each matching one of our 5 approved design brief done criteria:
  - Criterion 1: Chest target starts compressions and pace ring centers on chest.
  - Criterion 2: Compressions at 100 to 120 bpm grade mint green; deviations prompt "Faster" or "Slower".
  - Criterion 3: Exactly one instruction card is visible across all rescue phases.
  - Criterion 4: AED wayfinder arrow and chime trigger at designated elapsed time and dismiss upon confirmation.
  - Criterion 5: Replay panel calculates and displays accurate session statistics.
- **Spatial Audio & Procedural Meshes**: Synthesized clean audio tracks for metronome beats, dispatcher chimes, and shock cues; authored procedural geometry for chest rings and targets.

---

## Challenges We Ran Into

- **Additive Color Design**: The SPECS optical display is additive, meaning true black is rendered 100% transparent. We could not rely on dark background containers to isolate UI elements. We designed a clean 4-color palette (coral `#FF5A4E`, mint `#5CF2B5`, amber `#FFC24D`, and warm white `#F7F5F2`) that maintains readability directly over real-world surroundings without opaque boxes.
- **Standing vs Kneeling Parallax**: Rescuers transition from standing over the victim to kneeling on the floor beside them. Fixed-height world UI would either be blocked by knees or out of eye line. The dynamic glance placer solves this by tracking camera elevation and maintaining an ergonomic angle above the sternum.
- **Queueing Crisis Overlays**: Balancing automated safety timers (AED arrival, rescuer swaps) with user actions required an asynchronous queue so prompts never overlap or produce visual clutter.

---

## Accomplishments That We're Proud Of

- **100% LEAF Test Pass Rate**: All 5 end-to-end integration test scenarios pass reliably in the Lens Studio preview.
- **Single-Instruction Discipline**: Enforcing that only one card ever appears eliminated UI noise, creating a truly calm experience.
- **Spatial Audio Fidelity**: Emitting metronome ticks directly from the 3D position of the sternum anchors the rescuer's attention where their hands need to be.

---

## What We Learned

Designing for high-stress medical emergencies requires a completely different mindset than designing for games or productivity apps. Every second counts, every word must be minimal, and visual cues must reassure rather than alarm. AR glasses are uniquely suited for CPR because they keep the rescuer's hands completely free and keep their eyes on the patient.

---

## What's Next for Someone

- **Paired Smart AED Integration**: Direct BLE telemetry with public AED cabinets to update walking directions in real time as bystanders fetch the device.
- **Live Dispatcher Video Bridge**: Expanding the scripted dispatcher stand-in into a bidirectional WebRTC video call with real emergency services.
- **Multi-Glasses Bystander Relay**: Synchronizing multiple SPECS wearers so one user compresses while another sees real-time walking navigation to the nearest defibrillator.

---

## Built With

- `lens-studio`
- `typescript`
- `spectacles-interaction-kit`
- `leaf`
- `augmented-reality`
- `spatial-audio`
