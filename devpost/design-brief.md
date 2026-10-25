---
status: approved
---

# Design brief: Someone

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
I'm kneeling next to a person lying on the floor. A glowing target sits right on the center of their chest, real size, where my hands go. A ring around it pulses at 110 beats per minute and a soft beat sound comes from their chest. Every time I push, the ring tells me if I'm on pace: green is good, it says "Faster" or "Slower" if not. A small badge says the 911 dispatcher is connected and can see what I see.

## Why it belongs on glasses
- Uses: all three. It leaves your body free (both hands compress, eyes stay on the person), it draws in the world (the guide sits on the real chest at real size), and it shares your view (the dispatcher sees what you see).
- Why it's better than the phone or laptop version: CPR needs both hands and your eyes on the person. A phone would have to be put down, and then it can't guide you.
- The goal: when someone collapses and everyone freezes, Someone is the calm voice in your eyes that tells you exactly one thing to do at a time, so you become the "someone" everyone else is waiting for.

## Product or overlay
- Type: overlay. It responds to a real person who has collapsed.
- What the real version would sense: the person's chest (where to place hands), and the real pushes of your hands.
- Stand-in for the preview:
  - A virtual adult figure lying on the floor about 1 m in front of the user stands in for the real person.
  - "The glasses found the chest" is faked by pinching the figure's chest once to place the target. From then on the target, pace ring and beat are real.
  - One compression = one pinch (one mouse click) on the chest target.
  - The 911 dispatcher is scripted: pinching "Call 911" shows a "Dispatcher connected, viewing" badge and plays a calm scripted dispatcher voice with captions. No real call, no real video share.
  - The AED and the helper sent for it are scripted, on timers. The shock is simulated and delivered by the stand-in AED, not by the user.
  - All stand-ins are named as stand-ins in the video and the README.

## Where things live
- Where the user is looking during the main task: down at the person's chest, about 0.8 to 1 m in front and well below eye level. Everything clusters around that spot.
- Person (virtual figure): on the floor, real adult size (about 175 cm long), lying across the user's view, about 1 m in front of the start position.
- Chest target and pace ring: on the sternum, about 20 cm wide. This is the center of gaze.
- Instruction card: one short line in large text, floating about 30 cm above the chest and tilted toward the user, so it stays in the same glance as the hands. Only one at a time. Text height about 3 cm (default), light warm white on no dark panel.
- Dispatcher badge: small, on the top edge of the instruction card.
- Time since collapse: a small chip low and to the side, next to the person's shoulder. Inside the view, never in the center.
- AED prompt: the instruction card changes to "AED, 40 m. Send someone." A small arrow at the edge of the view points toward where the AED is, with a chime coming from that direction.
- AED pad overlay: on the figure's chest (upper right and lower left, standard pad positions) (default).
- Replay: in the same spot as the instruction card, above the chest, slightly larger (default).

## Hands and input
- Everything is a single pinch on a few large targets. No menus, no small buttons, no two-hand gestures.
- Step buttons: one big button on the instruction card: "I see someone", "Not breathing", "Call 911", later "Sent" (clears the AED prompt) and "Swapped" (clears the rescuer swap). At least 8 cm wide (default).
- Placing hands: pinch the chest target once. That starts compressions.
- One compression: one pinch on the chest target. The Lens timestamps each pinch and works out the rate from the last 4 to 6 intervals, which drives the ring color and the "Faster" / "Slower" cue. Until 3 intervals exist, the ring stays neutral coral (default).
- Rate bands: 100 to 120 per minute = green "Good". Under 100 = "Faster". Over 120 = "Slower". Within 10 of the band reads amber, further off reads red (default, from project design direction).
- Targets are big and highlight when aimed at.
- Voice: none required. "Call 911" is always a button. Nothing depends on the other hand.

## When things show
Exactly one instruction card is visible at any moment. Each step replaces the last with a slow fade (300 to 500 ms), never a pop.
- Start: figure on the floor, the clock starts, card says "Someone collapsed." with an "I see someone" button.
- Pinch "I see someone": card says "Tap their shoulder. Are they breathing?" with "Not breathing".
- Pinch "Not breathing": card shows "Call 911".
- Pinch "Call 911": dispatcher badge appears and stays until help arrives. Scripted dispatcher voice and captions start. Card says "Push here." over the chest target.
- Pinch the chest target: compressions start. Pace ring and the beat sound from the chest appear and stay only while compressing.
- Timer at 1:30: AED arrow, chime and the "AED, 40 m. Send someone." card with "Sent" appear. Compressions keep counting. Pinching "Sent" clears arrow and card.
- Timer at 2:00: card says "Switch with a helper if you can." Ring hides and scoring pauses until "Swapped" is pinched, then compressions resume.
- AED arrives on a timer after "Sent" (60 s real, default): ring hides, pad placement shows on the figure's chest, then "Stand clear." A simulated shock is delivered by the stand-in AED, then the card says to resume compressions.
- Help arrives on a short timer after that (20 s real, default): badge and clock disappear, card says "Help is here."
- Replay: only at the very end. Shows total compressions, % on pace, longest on-pace streak, time to first compression, and the line "You did not freeze."
- Prompt queue: if a timed prompt fires while another prompt is still waiting for its pinch, it waits in line and shows after that pinch, so there is never more than one card.
- If something needs attention out of view: the AED arrow at the edge of view plus a directional chime.
- Real timers are the default. A demo-mode flag shortens them so the full run fits in the video: AED prompt around 0:45; swap at 1:05, AED arrives 25 s after "Sent" so the swap comes first, help 10 s after the shock (default).

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Pinching the chest target starts compressions, and the pace ring appears centered on the figure's chest.
2. Pinching the target at a steady 100 to 120 per minute turns the ring green. Slower than 100 shows "Faster", and quicker than 120 shows "Slower".
3. Only one instruction card is visible at any moment across the whole flow, from "I see someone" to the replay.
4. At 1:30 since the collapse (or the shortened demo-mode time), the AED arrow and chime appear, and pinching "Sent" dismisses both.
5. The replay shows the correct total compression count and on-pace percentage for the pinches made.

## Out of scope
- Recognizing a real person or a real chest.
- Reading real hand pushes, compression depth, or hand speed (real glasses with hand tracking could; not in this build or the done criteria).
- A real 911 call, real video sharing, real voice commands, real speech recognition.
- Any medical claim. CPR circulates blood; only the (simulated) AED shock is presented as what treats the rhythm. Guidance aligns with the published rate of 100 to 120 per minute.

## Risks and open questions
- The flow is long. The compression moment gets the polish first; the AED pads and "help arrives" stay simple if time runs short (learner agreed).
- Clicking to compress could read as a rhythm game in the video. Frame the recording on the chest and ring, not the cursor.
- Feel unproven: comfort while kneeling and looking down for minutes, real hand tracking during compressions, how calm the voice feels in a real emergency.

## Design direction (from the project's design notes)
- Calm, clinical, premium. The opposite of an alarm.
- Palette: pulse coral-red #FF5A4E (ring and target only), on-pace mint #5CF2B5, caution amber #FFC24D, text warm white #F7F5F2. Nothing else. No dark panels.
- One clean grotesk typeface, large, sentence case, short verbs ("Push here.", "Faster.").
- Slow eases for UI (300 to 500 ms). The ring pulse is the only rhythmic motion. No bounces, no pops.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
