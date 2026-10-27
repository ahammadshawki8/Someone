// Synthesizes the film's sound design (no samples, license-clean).
// Usage: node tools/gen_film_sfx.js <outDir>
//   heartbeat.wav  one low "lub-dub" (play it on each beat)
//   monitor.wav    one soft ECG monitor beep
//   flatline.wav   a 4 s flatline tone with a slow fade
// 48 kHz, 16-bit, mono.
const fs = require("fs")
const path = require("path")

const SR = 48000
const out = path.resolve(process.argv[2] || ".")
fs.mkdirSync(out, {recursive: true})

function writeWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(v * 32767), i * 2)
  }
  const h = Buffer.alloc(44)
  h.write("RIFF", 0)
  h.writeUInt32LE(36 + data.length, 4)
  h.write("WAVEfmt ", 8)
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(1, 22)
  h.writeUInt32LE(SR, 24)
  h.writeUInt32LE(SR * 2, 28)
  h.writeUInt16LE(2, 32)
  h.writeUInt16LE(16, 34)
  h.write("data", 36)
  h.writeUInt32LE(data.length, 40)
  fs.writeFileSync(path.join(out, name), Buffer.concat([h, data]))
}

// A soft thump: a falling low sine with a fast attack and an exponential tail.
function thump(buf, at, f0, f1, dur, gain) {
  const n = Math.floor(dur * SR)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = f1 + (f0 - f1) * Math.exp(-t * 18)
    phase += (2 * Math.PI * f) / SR
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 11)
    const j = Math.floor(at * SR) + i
    if (j < buf.length) buf[j] += Math.sin(phase) * env * gain
  }
}

{
  const buf = new Float32Array(Math.floor(0.7 * SR))
  thump(buf, 0.0, 90, 48, 0.35, 0.95) // lub
  thump(buf, 0.24, 80, 44, 0.3, 0.7) // dub
  writeWav("heartbeat.wav", buf)
}
{
  const dur = 0.16
  const buf = new Float32Array(Math.floor(0.4 * SR))
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.004) * Math.min(1, (dur - t) / 0.02)
    buf[i] = Math.sin(2 * Math.PI * 1000 * t) * env * 0.35
  }
  writeWav("monitor.wav", buf)
}
{
  const dur = 4.0
  const buf = new Float32Array(Math.floor(dur * SR))
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.01) * Math.min(1, (dur - t) / 1.5)
    buf[i] = Math.sin(2 * Math.PI * 1000 * t) * env * 0.28
  }
  writeWav("flatline.wav", buf)
}
console.log("wrote heartbeat.wav, monitor.wav, flatline.wav to", out)
