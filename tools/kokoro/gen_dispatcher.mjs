// Generates the scripted dispatcher voice clips with Kokoro-82M (Apache 2.0).
// Usage (from tools/kokoro): npm install && node gen_dispatcher.mjs
// Writes Someone/Assets/GeneratedSFX/Dispatcher/SomeoneDispatcher_NN_<cue>.wav
// Spoken text mirrors DISPATCHER_LINES in SomeoneConfig.ts; "911" is written
// out so it is read the way dispatchers say it.
import {KokoroTTS} from "kokoro-js"
import {execFileSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import {fileURLToPath} from "node:url"

const VOICE = "af_heart"
const SPEED = 0.95
const FFMPEG = process.env.FFMPEG || "C:/ffmpeg/bin/ffmpeg.exe"

const LINES = [
  ["00_connected", "Nine one one. I'm with you, and I can see what you see."],
  ["01_placeHands", "Put the heel of your hand on the center of their chest."],
  ["02_firstCompression", "Good. Push hard and fast, with the beat."],
  ["03_aedPrompt", "Don't ask the crowd. Point at one person and say: you, get the A E D."],
  ["04_sent", "Help is on the way. Keep going."],
  ["05_swap", "If someone can take over, switch now. Keep the rhythm."],
  ["06_aedArrives", "The A E D will guide the shock. Pads go where shown."],
  ["07_standClear", "Don't touch them while the A E D works."],
  ["08_afterShock", "Start pushing again right away."],
  ["09_helpArrives", "The paramedics are with you now."]
]

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, "../../Someone/Assets/GeneratedSFX/Dispatcher")

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {dtype: "fp32", device: "cpu"})
for (const [id, text] of LINES) {
  const audio = await tts.generate(text, {voice: VOICE, speed: SPEED})
  const file = path.join(outDir, `SomeoneDispatcher_${id}.wav`)
  const raw = file + ".raw.wav"
  await audio.save(raw)
  // Light call-line band, even loudness, 16-bit 44.1 kHz mono for Lens Studio.
  execFileSync(FFMPEG, [
    "-v", "error", "-y", "-i", raw,
    "-af", "highpass=f=170,lowpass=f=6500,loudnorm=I=-18:TP=-2:LRA=7,aresample=44100",
    "-ac", "1", "-c:a", "pcm_s16le", file
  ])
  fs.unlinkSync(raw)
  console.log(`${id}: ${(audio.audio.length / audio.sampling_rate).toFixed(2)} s`)
}
