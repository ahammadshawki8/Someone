// Generates the demo video narration (stand-in voice) with Kokoro-82M (Apache 2.0).
// Usage (from tools/kokoro): node gen_narration.mjs <outDir>
// Lines mirror devpost/video-script.md (documentary cut). Prints each clip's duration.
import {KokoroTTS} from "kokoro-js"
import {execFileSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const VOICE = "af_bella"
const SPEED = 0.95
const FFMPEG = process.env.FFMPEG || "C:/ffmpeg/bin/ffmpeg.exe"

const LINES = [
  ["H1", "Every day, someone collapses in a crowd. And every time, the crowd does the same thing. It waits."],
  ["P1", "In the US alone, more than two hundred and sixty thousand people a year go into cardiac arrest outside a hospital. Fewer than half get CPR from a bystander. And it isn't because people don't know how. Of trained bystanders who didn't help, thirty seven percent said they simply panicked. Every minute without CPR, the chance of survival drops by about ten percent."],
  ["S1", "The problem isn't knowledge. It's the freeze. So we built Someone. A Lens for Snap Specs that turns a frozen bystander into the someone."],
  ["W1", "It gives you one calm instruction at a time. Check them. Call nine one one. The dispatcher connects, and sees exactly what you see."],
  ["W2", "Then it draws the guide on the body. A target at the center of the chest, at real size. Your hands push, the glasses count every stroke, and the ring keeps you at a hundred and ten a minute."],
  ["W3", "When the A E D is needed, Someone never asks the crowd. It tells you to point at one person. That is how you break the bystander effect."],
  ["W4", "It calls the swap, shows where the pads go, and keeps you clear for the shock."],
  ["W5", "And when help arrives, it tells you the one thing you need to hear."],
  ["Y1", "Someone uses everything glasses can do that a phone can't, in a single moment. It shares your view, draws on the world, and leaves both hands free. It was planned with plan lens, built end to end by a coding agent through CLAD and the Lens Studio MCP, and proven by eight LEAF tests in the preview."],
  ["C1", "In a crowd, everyone waits. Be the someone who moves first."]
]
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
