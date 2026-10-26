# Someone: video plan

Under 3:00 (target 2:50), public on YouTube. Every frame is our own: Lens Studio preview recordings of the real Lens, our own Remotion and Blender renders, our own voice. No third-party clips, music, logos or trademarks. AHA, Red Cross and CARES are cited as plain text only.

## Rules for this video

- **Show the real Lens only.** Everything in the 0:30 to 2:00 block is a screen recording of the Lens Studio preview, unedited inside each shot.
- **Name every stand-in on screen.** Small caption the first time each one appears: "Virtual figure (stand-in)", "One click = one compression in the preview", "Scripted dispatcher".
- **Never claim what the preview cannot show.** No real person under the overlays, no depth, no hand tracking, no real call.
- **No medical outcomes.** CPR keeps blood moving; the AED shock is simulated. Nobody "comes back to life" on screen.
- **Frame the chest, not the cursor.** Hide the cursor where possible, so compressions do not read as a rhythm game.

## Timeline

| Time | Content | Source |
|---|---|---|
| 0:00 to 0:15 | Black. Crowd murmur. A voice: "Someone call 911. Someone help." Stylized silhouettes look at each other; nobody moves. Title: **Someone** | Blender silhouettes + Remotion |
| 0:15 to 0:30 | Three stat cards, one at a time: "42% get CPR from a bystander." "Of trained bystanders who did not help, 37% said they panicked." "Every minute without CPR, survival falls about 10%." Then: "Built for the person who freezes." | Remotion |
| 0:30 to 2:00 | **Live preview run in demo mode.** Collapse, check, call (badge + dispatcher caption), "Push here.", pace ring going from neutral to mint, one "Faster." moment, AED chime + edge arrow + "Sent", swap, pads + "Stand clear.", "Help is here.", replay with *You did not freeze.* | Lens Studio Interactive Preview, ffmpeg capture |
| 2:00 to 2:40 | How it was built: plan-lens interview and approved brief, the agent building through CLAD and the MCP, the five LEAF scenarios passing | Screen recordings from the build |
| 2:40 to 2:50 | The pace ring pulsing alone on black. *In a crowd, everyone waits. You won't.* **Someone. Be the someone.** | Remotion |

## Capture the preview

1. Open the project in Lens Studio. Preview panel: Interactive Preview, device SPECS, a calm indoor scene.
2. Select `SomeoneExperience` and tick `demoMode` (AED prompt 0:45, swap 1:05, AED arrives 25 s after "Sent", help 10 s after the shock).
3. Start the preview at the user's position. Step down to kneeling height with Q so the chest is about 85 cm ahead.
4. Record the preview panel only, at 60 fps:
   ```
   C:\ffmpeg\bin\ffmpeg.exe -f gdigrab -framerate 60 -i title="Lens Studio" -c:v libx264 -crf 16 -pix_fmt yuv420p video\raw\preview_run.mp4
   ```
   Crop to the panel in the edit. Record Lens audio (metronome, chime, dispatcher) with the same take.
5. Pinch to the beat. Aim for mint most of the run, with one deliberate slow stretch to show "Faster.".
6. Do three full takes. Keep the cleanest.

## Capture the build story

- The approved brief: scroll `devpost/design-brief.md`, done criteria visible.
- The LEAF panel running all five scenarios, ending on five passes.
- A short clip of the agent working in Lens Studio through the MCP.

## Voiceover (about 280 words, read calmly, not acted)

> When someone collapses, everyone looks at everyone else. We all wait for someone.
>
> Most people know CPR exists. The problem is the freeze. Of trained bystanders who did not help, more than a third said they simply panicked.
>
> Someone is a Lens for Snap SPECS, built for that moment. It shows one thing to do at a time. Is the person breathing? No. Call 911.
>
> The dispatcher connects and sees what you see. Then a target appears on the center of the chest, where your hands go, and a ring pulses at 110 beats a minute. The beat comes from the chest itself. Push with it. Mint means you are on pace. Too slow, and it tells you, quietly.
>
> Your hands stay on the person. Your eyes stay on the person. That is why this belongs on glasses: a phone would have to be put down.
>
> At a minute and a half, a chime from beside you. The AED is forty meters away. Send someone. At two minutes, switch with a helper. When the AED arrives, the pads show where they go. Stand clear.
>
> When help arrives, you see what you did. And one line: You did not freeze.
>
> In the preview, the person is a virtual figure, a click is a compression, and the dispatcher is scripted. Real glasses could do more. The design stays the same: one calm step at a time.
>
> We planned it with plan-lens, built it through CLAD and the Lens Studio MCP, and tested every done criterion with LEAF.
>
> In a crowd, everyone waits. You won't.

## Audio

- Lens audio from the preview take (metronome, chime, dispatcher).
- Owner's voiceover, recorded quietly, no music under the live run. If any music is used elsewhere: royalty-free only, with the license saved in `video/licenses/`.

## Before upload

- [ ] Under 3:00.
- [ ] Every stand-in labelled on screen.
- [ ] Stats match the README wording exactly.
- [ ] No third-party logos, clips or music without a license.
- [ ] No em or en dashes in titles and captions.
- [ ] Uploaded public on YouTube; link pasted into Devpost.
