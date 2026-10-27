// Generates the demo video narration (stand-in voice) with Kokoro-82M (Apache 2.0).
// Usage (from tools/kokoro): node gen_narration.mjs <outDir>
// Lines mirror devpost/video-script.md. Prints each clip's duration.
import {KokoroTTS} from "kokoro-js"
import {execFileSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const VOICE = "am_michael"
const SPEED = 1.0
const FFMPEG = process.env.FFMPEG || "C:/ffmpeg/bin/ffmpeg.exe"

const LINES = [
  ["N1", "When someone collapses, a crowd forms. And everyone waits for someone else to act."],
  ["N2", "In the US, only about four in ten cardiac arrest patients get CPR from a bystander. Of trained bystanders who didn't help, thirty seven percent said they simply panicked. And every minute without CPR, the chance of survival drops by about ten percent."],
  ["N3", "Someone is a Lens for Snap Specs that turns a frozen bystander into the someone. One calm step at a time, both hands free, with nine one one seeing what you see."],
  ["N4", "It only ever shows one instruction. Check them. Call nine one one. The dispatcher connects, sees your view, and talks you through it."],
  ["N5", "A target sits on the center of the chest, at real size. Your hands push, and on Specs, hand tracking counts every stroke. The ring pulses at a hundred and ten a minute, the beat comes from the chest, and it turns mint when you're on pace."],
  ["N6", "At ninety seconds, a chime and an arrow point to the A E D. And Someone never asks the crowd. It tells you to point at one person. That's how you break the bystander effect."],
  ["N7", "It prompts a swap at two minutes, shows where the pads go, and keeps you clear for the shock."],
  ["N8", "When help arrives, a quiet replay. And one line. You did not freeze."],
  ["N9", "Someone was planned with the plan lens skill, built end to end by a coding agent through CLAD and the Lens Studio MCP, and checked by seven LEAF tests that run in the preview."],
  ["N10", "In a crowd, everyone waits. You won't."]
]

const outDir = path.resolve(process.argv[2] || "narration")
fs.mkdirSync(outDir, {recursive: true})
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {dtype: "fp32", device: "cpu"})
const durations = {}
for (const [id, text] of LINES) {
  const audio = await tts.generate(text, {voice: VOICE, speed: SPEED})
  const raw = path.join(outDir, `${id}.raw.wav`)
  await audio.save(raw)
  execFileSync(FFMPEG, ["-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000", "-ac", "2", "-c:a", "pcm_s16le", path.join(outDir, `${id}.wav`)])
  fs.unlinkSync(raw)
  durations[id] = +(audio.audio.length / audio.sampling_rate).toFixed(2)
  console.log(`${id}: ${durations[id]} s`)
}
fs.writeFileSync(path.join(outDir, "durations.json"), JSON.stringify(durations, null, 2))
