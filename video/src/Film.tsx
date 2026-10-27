/**
 * Someone: the film. 1920x1080, 30 fps, under 3:00.
 * Hook, problem, turn, walkthrough, why it wins, close.
 * Our own graphics + the Lens Studio preview recorded live + licensed stock
 * (Pexels, Mixkit; credited at the end). Brand: brand/README.md.
 */
import {loadFont} from "@remotion/google-fonts/Inter"
import React from "react"
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame
} from "remotion"
import durations from "../public/narration/durations.json"
import walk from "./walkthrough.json"

const {fontFamily} = loadFont("normal", {weights: ["400", "500", "600"], subsets: ["latin"]})

export const FPS = 30
const C = {
  ink: "#0B0B0C",
  coral: "#FF5A4E",
  mint: "#5CF2B5",
  amber: "#FFC24D",
  white: "#F7F5F2",
  slate: "#8A8F98",
  dim: "rgba(247,245,242,0.62)"
}
const sec = (s: number) => Math.round(s * FPS)
type NId = keyof typeof durations
const nar = (id: NId) => (durations as Record<string, number>)[id]
const ease = Easing.bezier(0.25, 0.1, 0.25, 1)

// ---- Timeline ------------------------------------------------------------------------
type Beat = {
  id: string
  src: string
  from: number
  to: number
  rate: number
  chapter: string
  title: string
  sub: string
  nar?: NId
  narDelay?: number
  pillars: number[]
  hands?: boolean
  beats?: [number, number]
  chimes?: number[]
}
const WALK = walk as Beat[]
const beatLen = (b: Beat) => sec((b.to - b.from) / b.rate) + (b.hands ? sec(HANDS_SEC) : 0)
const HANDS_SEC = 3.2

const SCENES = [
  {id: "hook", len: sec(Math.max(17, 10.8 + nar("H1") + 1.2))},
  {id: "problem", len: sec(nar("P1") + 1.6)},
  {id: "turn", len: sec(Math.max(10, nar("S1") + 2.0))},
  {id: "walk", len: WALK.reduce((a, b) => a + beatLen(b), 0)},
  {id: "why", len: sec(nar("Y1") + 2.5)},
  {id: "close", len: sec(14)}
]
const XF = 14 // cross-dissolve frames between acts
const starts: Record<string, number> = {}
{
  let t = 0
  for (const s of SCENES) {
    starts[s.id] = t
    t += s.len - XF
  }
}
export const totalFrames = () => SCENES.reduce((a, s) => a + s.len - XF, 0) + XF

// ---- Motion helpers -------------------------------------------------------------------
const clamp = {extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const}
const fadeIO = (f: number, len: number, d = 14) =>
  Math.min(interpolate(f, [0, d], [0, 1], clamp), interpolate(f, [len - d, len], [1, 0], clamp))

const Rise: React.FC<{at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, out, children, style}) => {
  const f = useCurrentFrame()
  const a = interpolate(f, [at, at + 16], [0, 1], {...clamp, easing: ease})
  const b = out === undefined ? 1 : interpolate(f, [out, out + 14], [1, 0], clamp)
  const y = interpolate(f, [at, at + 20], [18, 0], {...clamp, easing: ease})
  return <div style={{opacity: Math.min(a, b), transform: `translateY(${y}px)`, ...style}}>{children}</div>
}

/** Stock clip: slow push-in, gentle grade, letterbox. */
const Stock: React.FC<{src: string; len: number; start?: number; rate?: number; dark?: number; zoom?: number}> = ({
  src,
  len,
  start = 0,
  rate = 1,
  dark = 0.35,
  zoom = 0.06
}) => {
  const f = useCurrentFrame()
  const s = 1 + zoom * (f / Math.max(1, len))
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={sec(start)}
        playbackRate={rate}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})`, filter: "saturate(0.72) contrast(1.05)"}}
      />
      <AbsoluteFill style={{background: `rgba(11,11,12,${dark})`}} />
      <AbsoluteFill style={{boxShadow: "inset 0 0 220px rgba(0,0,0,0.65)"}} />
    </AbsoluteFill>
  )
}

const Letterbox: React.FC = () => (
  <>
    <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 64, background: "#000"}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "#000"}} />
  </>
)

const Mark: React.FC<{size: number; draw?: number; dot?: number; pulse?: number}> = ({size, draw = 1, dot = 1, pulse = 0}) => {
  const r = 44
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{transform: `scale(${1 + 0.06 * pulse})`}}>
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={C.coral}
        strokeWidth="5.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - draw)}
        transform="rotate(-90 60 60)"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r={12.5 * dot} fill={C.coral} />
    </svg>
  )
}

const Wordmark: React.FC<{size: number; color?: string}> = ({size, color = C.white}) => (
  <div style={{fontFamily, fontWeight: 600, fontSize: size, letterSpacing: -size * 0.028, color, lineHeight: 1}}>someone</div>
)

/** Heartbeat sfx every `period` seconds from `from` to `to` (scene-local seconds). */
const Heartbeats: React.FC<{from: number; to: number; period: number; volume: number}> = ({from, to, period, volume}) => {
  const n = Math.max(0, Math.floor((to - from) / period))
  return (
    <>
      {Array.from({length: n}).map((_, i) => (
        <Sequence key={i} from={sec(from + i * period)} durationInFrames={sec(0.8)}>
          <Audio src={staticFile("sfx/heartbeat.wav")} volume={volume} />
        </Sequence>
      ))}
    </>
  )
}

const Narration: React.FC<{id: NId; at: number}> = ({id, at}) => (
  <Sequence from={sec(at)}>
    <Audio src={staticFile(`narration/${id}.wav`)} volume={1} />
  </Sequence>
)

// ---- 1. Hook ------------------------------------------------------------------------
const Hook: React.FC<{len: number}> = ({len}) => {
  const f = useCurrentFrame()
  const t = f / FPS
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      <Sequence from={sec(1.6)} durationInFrames={sec(3.4)}>
        <Stock src="stock/feet.mp4" len={sec(3.4)} rate={0.6} dark={0.25} />
      </Sequence>
      <Sequence from={sec(4.6)} durationInFrames={sec(3.0)}>
        <Stock src="stock/crosswalk.mp4" len={sec(3.0)} rate={0.6} dark={0.25} />
      </Sequence>
      <Sequence from={sec(10.2)} durationInFrames={len - sec(10.2)}>
        <Stock src="stock/crowd.mp4" len={len - sec(10.2)} rate={0.5} dark={0.5} zoom={0.08} />
      </Sequence>
      <Letterbox />
      {/* Time stamp over the ordinary morning */}
      <Rise at={sec(0.5)} out={sec(6.8)} style={{position: "absolute", left: 120, bottom: 120}}>
        <div style={{fontSize: 30, color: C.dim, letterSpacing: 2}}>TUESDAY, 8:42 A.M.</div>
      </Rise>
      {/* The collapse: hard cut to black */}
      {t >= 7.6 && t < 10.2 ? <AbsoluteFill style={{background: "#000"}} /> : null}
      <Rise at={sec(8.0)} out={sec(9.8)} style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{fontSize: 84, fontWeight: 600, letterSpacing: -2}}>Someone collapses.</div>
      </Rise>
      <Rise at={sec(10.8)} out={len - sec(1.2)} style={{position: "absolute", left: 0, right: 0, top: 410, textAlign: "center"}}>
        <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1.5}}>A crowd forms.</div>
      </Rise>
      <Rise at={sec(13.4)} out={len - sec(1.2)} style={{position: "absolute", left: 0, right: 0, top: 500, textAlign: "center"}}>
        <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1.5, color: C.dim}}>Everyone waits for someone else.</div>
      </Rise>
      <Heartbeats from={0.2} to={7.0} period={0.86} volume={0.9} />
      <Sequence from={sec(6.6)} durationInFrames={sec(0.4)}>
        <Audio src={staticFile("sfx/monitor.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={sec(7.6)} durationInFrames={sec(4)}>
        <Audio src={staticFile("sfx/flatline.wav")} volume={0.55} />
      </Sequence>
      <Narration id="H1" at={10.8} />
    </AbsoluteFill>
  )
}

// ---- 2. Problem ---------------------------------------------------------------------
const Counter: React.FC<{to: number; at: number; dur: number}> = ({to, at, dur}) => {
  const f = useCurrentFrame()
  const v = Math.round(interpolate(f, [at, at + dur], [0, to], {...clamp, easing: Easing.out(Easing.cubic)}))
  return <>{v.toLocaleString("en-US")}</>
}

const Problem: React.FC<{len: number}> = ({len}) => {
  const n = sec(nar("P1"))
  const at = (p: number) => sec(0.6) + Math.round(n * p)
  const f = useCurrentFrame()
  const dots = 10
  const drain = interpolate(f, [at(0.8), at(0.8) + sec(4)], [1, 0.4], clamp)
  const card = (i: number, a: number, big: React.ReactNode, small: string, color = C.white) => (
    <Rise at={a} style={{width: 380}}>
      <div style={{fontSize: 96, fontWeight: 600, letterSpacing: -3, color, lineHeight: 1}}>{big}</div>
      <div style={{fontSize: 26, color: C.dim, marginTop: 16, lineHeight: 1.4}}>{small}</div>
    </Rise>
  )
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      <Stock src="stock/monitor.mp4" len={len} rate={0.7} dark={0.78} zoom={0.05} />
      <Letterbox />
      <div style={{position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 64}}>
        {card(0, at(0.0), <Counter to={263700} at={at(0.0)} dur={sec(2.2)} />, "cardiac arrests outside a hospital in the US, every year")}
        <Rise at={at(0.27)} style={{width: 380}}>
          <div style={{display: "flex", gap: 10, height: 96, alignItems: "center"}}>
            {Array.from({length: dots}).map((_, i) => (
              <div key={i} style={{width: 26, height: 26, borderRadius: 13, background: i < 4 ? C.white : "transparent", border: `2px solid ${i < 4 ? C.white : "rgba(247,245,242,0.35)"}`}} />
            ))}
          </div>
          <div style={{fontSize: 26, color: C.dim, marginTop: 16, lineHeight: 1.4}}>only 4 in 10 get CPR from a bystander</div>
        </Rise>
        {card(2, at(0.55), "37%", "of trained bystanders who did not help said they panicked", C.coral)}
        <Rise at={at(0.8)} style={{width: 380}}>
          <div style={{fontSize: 96, fontWeight: 600, letterSpacing: -3, lineHeight: 1}}>10%</div>
          <div style={{height: 6, background: "rgba(247,245,242,0.15)", marginTop: 18, borderRadius: 3}}>
            <div style={{width: `${drain * 100}%`, height: 6, background: C.coral, borderRadius: 3}} />
          </div>
          <div style={{fontSize: 26, color: C.dim, marginTop: 14, lineHeight: 1.4}}>less chance of survival every minute without CPR</div>
        </Rise>
      </div>
      <Rise at={sec(1)} style={{position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 18, color: "rgba(247,245,242,0.4)"}}>CARES 2024 via AHA 2025 Guidelines · CARES 2025 · Swor et al., Acad Emerg Med 2006 · American Red Cross</div>
      </Rise>
      <Narration id="P1" at={0.6} />
    </AbsoluteFill>
  )
}

// ---- 3. Turn ------------------------------------------------------------------------
const Turn: React.FC<{len: number}> = () => {
  const f = useCurrentFrame()
  const logoAt = sec(4.3)
  const draw = interpolate(f, [logoAt, logoAt + 26], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)})
  const dot = interpolate(f, [logoAt + 20, logoAt + 34], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))})
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white, alignItems: "center", justifyContent: "center"}}>
      <Rise at={sec(0.3)} out={sec(3.8)} style={{position: "absolute", top: 420, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 70, fontWeight: 600, letterSpacing: -1.5, color: C.dim}}>The problem isn't knowledge.</div>
      </Rise>
      <Rise at={sec(2.0)} out={sec(3.8)} style={{position: "absolute", top: 520, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 70, fontWeight: 600, letterSpacing: -1.5}}>It's the freeze.</div>
      </Rise>
      <div style={{display: "flex", alignItems: "center", gap: 36, opacity: interpolate(f, [logoAt, logoAt + 8], [0, 1], clamp)}}>
        <Mark size={150} draw={draw} dot={dot} />
        <Rise at={logoAt + 22}>
          <Wordmark size={130} />
        </Rise>
      </div>
      <Rise at={logoAt + 40} style={{position: "absolute", top: 650, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 32, color: C.dim}}>A Lens for Snap Specs</div>
      </Rise>
      <Narration id="S1" at={0.3} />
    </AbsoluteFill>
  )
}

// ---- 4. Walkthrough ------------------------------------------------------------------
const PILLARS = ["Shares your view", "Draws in the world", "Leaves your body free"]
const FOOT_W = 1100
const FOOT_H = 1016

const Walkthrough: React.FC = () => {
  let t = 0
  const parts = WALK.map((b) => {
    const from = t
    const len = beatLen(b)
    t += len
    return {b, from, len}
  })
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      {parts.map(({b, from, len}) => (
        <Sequence key={b.id} from={from} durationInFrames={len}>
          <BeatView b={b} len={len} />
          {b.nar ? <Narration id={b.nar} at={b.narDelay ?? 0.4} /> : null}
          {b.beats ? <MetronomeAudio from={(b.hands ? HANDS_SEC : 0) + b.beats[0]} to={(b.hands ? HANDS_SEC : 0) + b.beats[1]} /> : null}
          {(b.chimes ?? []).map((c) => (
            <Sequence key={c} from={sec(c)} durationInFrames={sec(2)}>
              <Audio src={staticFile("SomeoneAEDChime.wav")} volume={0.3} />
            </Sequence>
          ))}
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

const MetronomeAudio: React.FC<{from: number; to: number}> = ({from, to}) => {
  const period = 60 / 110
  const n = Math.max(0, Math.floor((to - from) / period))
  return (
    <>
      {Array.from({length: n}).map((_, i) => (
        <Sequence key={i} from={sec(from + i * period)} durationInFrames={sec(0.3)}>
          <Audio src={staticFile("SomeoneMetronome.wav")} volume={0.18} />
        </Sequence>
      ))}
    </>
  )
}

const BeatView: React.FC<{b: Beat; len: number}> = ({b, len}) => {
  const f = useCurrentFrame()
  const handsLen = b.hands ? sec(HANDS_SEC) : 0
  const lensF = f - handsLen
  const o = fadeIO(f, len, 10)
  return (
    <AbsoluteFill>
      {b.hands ? (
        <Sequence durationInFrames={handsLen + 8}>
          <Stock src="stock/hands.mp4" len={handsLen} rate={1} dark={0.22} zoom={0.04} />
          <Letterbox />
          <Rise at={sec(0.3)} style={{position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center"}}>
            <div style={{fontSize: 58, fontWeight: 600, letterSpacing: -1}}>Your hands push.</div>
          </Rise>
        </Sequence>
      ) : null}
      <Sequence from={handsLen}>
        <AbsoluteFill style={{opacity: interpolate(lensF, [0, 10], [0, 1], clamp)}}>
          {/* Centered Specs view: symmetric by construction */}
          <div
            style={{
              position: "absolute",
              left: (1920 - FOOT_W) / 2,
              top: (1080 - FOOT_H) / 2,
              width: FOOT_W,
              height: FOOT_H,
              overflow: "hidden",
              borderRadius: 22,
              boxShadow: "0 30px 90px rgba(0,0,0,0.55)"
            }}
          >
            <OffthreadVideo
              src={staticFile(b.src)}
              startFrom={sec(b.from)}
              playbackRate={b.rate}
              muted
              style={{width: "100%", height: "100%", objectFit: "cover"}}
            />
          </div>
          {/* Left: chapter */}
          <div style={{position: "absolute", left: 70, top: 380, width: 300, opacity: o}}>
            <div style={{fontSize: 22, color: C.coral, letterSpacing: 3, fontWeight: 600}}>{b.chapter}</div>
            <div style={{fontSize: 40, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.15, marginTop: 14}}>{b.title}</div>
            <div style={{fontSize: 22, color: C.dim, lineHeight: 1.45, marginTop: 16}}>{b.sub}</div>
            {b.rate > 1.05 ? <div style={{fontSize: 18, color: C.slate, marginTop: 18}}>{`shown at ${b.rate}x`}</div> : null}
          </div>
          {/* Right: the three glasses pillars, lit when this beat uses them */}
          <div style={{position: "absolute", right: 70, top: 380, width: 300, opacity: o}}>
            {PILLARS.map((p, i) => {
              const on = b.pillars.includes(i)
              return (
                <div key={p} style={{display: "flex", alignItems: "center", gap: 14, marginBottom: 26}}>
                  <div style={{width: 12, height: 12, borderRadius: 6, background: on ? C.mint : "transparent", border: `2px solid ${on ? C.mint : "rgba(247,245,242,0.3)"}`}} />
                  <div style={{fontSize: 24, color: on ? C.white : "rgba(247,245,242,0.35)", fontWeight: on ? 600 : 500}}>{p}</div>
                </div>
              )
            })}
          </div>
          <div style={{position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontSize: 15, color: "rgba(247,245,242,0.42)"}}>
            Lens Studio preview, recorded live. Stand-ins: the person is a figure in the preview; a pinch stands in for a push (tracked hands on Specs); the dispatcher, AED and shock are scripted.
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  )
}

// ---- 5. Why it wins -----------------------------------------------------------------
const Why: React.FC<{len: number}> = () => {
  const n = sec(nar("Y1"))
  const at = (p: number) => sec(0.5) + Math.round(n * p)
  const tests = [
    "Pushes start compressions on the chest",
    "100 to 120 a minute turns the ring mint",
    "One instruction at a time",
    "AED prompt and chime at 1:30",
    "Replay counts are exact",
    "Hand-tracked strokes count, tremor does not",
    "Dispatcher never cut, prompts never stack",
    "The whole rescue, end to end"
  ]
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      <div style={{position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60}}>
        {PILLARS.map((p, i) => (
          <Rise key={p} at={at(0.0) + i * 9} style={{width: 420, borderTop: `2px solid ${C.mint}`, paddingTop: 20}}>
            <div style={{fontSize: 36, fontWeight: 600}}>{p}</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>
              {["the dispatcher sees through your eyes", "the guide sits on the chest, at real size", "both hands on the chest, eyes on the person"][i]}
            </div>
          </Rise>
        ))}
      </div>
      <Rise at={at(0.0) + 36} style={{position: "absolute", top: 380, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 30, color: C.mint, fontWeight: 600}}>All three, in one moment.</div>
      </Rise>
      <div style={{position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 70, alignItems: "flex-start"}}>
        <Rise at={at(0.45)}>
          <div style={{width: 640, height: 286, overflow: "hidden", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)"}}>
            <img src={staticFile("shots/agent.png")} style={{width: 640, display: "block", transformOrigin: "30% 40%", transform: `scale(${1 + 0.12 * Math.min(1, Math.max(0, (useCurrentFrame() - at(0.45)) / (n * 0.55)))})`}} />
          </div>
          <div style={{fontSize: 20, color: C.dim, marginTop: 12, width: 640}}>Planned with plan-lens. Built end to end by a coding agent through CLAD and the Lens Studio MCP.</div>
        </Rise>
        <div>
          {tests.map((s, i) => (
            <Rise key={s} at={at(0.6) + i * 6}>
              <div style={{display: "flex", gap: 16, fontSize: 24, marginBottom: 12}}>
                <span style={{color: C.mint, fontWeight: 600}}>PASS</span>
                <span>{s}</span>
              </div>
            </Rise>
          ))}
          <Rise at={at(0.6) + tests.length * 6 + 8}>
            <div style={{fontSize: 26, color: C.mint, fontWeight: 600, marginTop: 10}}>8 of 8 LEAF scenarios pass in the preview</div>
          </Rise>
        </div>
      </div>
      <Narration id="Y1" at={0.5} />
    </AbsoluteFill>
  )
}

// ---- 6. Close -----------------------------------------------------------------------
const Close: React.FC<{len: number}> = ({len}) => {
  const f = useCurrentFrame()
  const t = f / FPS
  const beat = (t * 1.15) % 1
  const pulse = beat < 0.15 ? Math.sin((beat / 0.15) * Math.PI) : 0
  const lock = sec(6.2)
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      <Sequence durationInFrames={sec(5.4)}>
        <Stock src="stock/station.mp4" len={sec(5.4)} rate={0.5} dark={0.55} zoom={0.07} />
        <Letterbox />
        <Rise at={sec(0.4)} out={sec(4.6)} style={{position: "absolute", left: 0, right: 0, top: 470, textAlign: "center"}}>
          <div style={{fontSize: 72, fontWeight: 600, letterSpacing: -1.5}}>In a crowd, everyone waits.</div>
        </Rise>
      </Sequence>
      <Sequence from={sec(5.0)}>
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", opacity: interpolate(f - sec(5.0), [0, 14], [0, 1], clamp)}}>
          <div style={{transform: `translateY(${interpolate(f, [lock, lock + 24], [0, -90], {...clamp, easing: ease})}px)`}}>
            <Mark size={170} pulse={pulse} />
          </div>
          <Rise at={sec(5.6)} style={{position: "absolute", top: 600, left: 0, right: 0, textAlign: "center"}}>
            <div style={{fontSize: 66, fontWeight: 600, letterSpacing: -1.5}}>
              Be the someone who <span style={{color: C.mint}}>moves first.</span>
            </div>
          </Rise>
          <Rise at={lock + 20} style={{position: "absolute", top: 730, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
            <Wordmark size={56} color={C.dim} />
          </Rise>
        </AbsoluteFill>
      </Sequence>
      <Rise at={sec(10.0)} style={{position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 15, color: "rgba(247,245,242,0.45)", lineHeight: 1.6}}>
          Stock footage: Pexels (Kindel Media, cottonbro studio and contributors) and Mixkit, used under their free licenses. Music: "Silent Descent", Mixkit.
          <br />
          Narration: Kokoro-82M text to speech. Someone is a design concept and practice tool, not a medical device. Take a certified CPR course.
        </div>
      </Rise>
      <Heartbeats from={5.0} to={len / FPS - 1.0} period={0.87} volume={0.7} />
      <Narration id="C1" at={0.5} />
    </AbsoluteFill>
  )
}

// ---- Score + assembly ---------------------------------------------------------------
const Score: React.FC = () => {
  const total = totalFrames()
  const walkAt = starts.walk
  return (
    <Audio
      src={staticFile("music/mixkit_614.mp3")}
      volume={(f) =>
        interpolate(
          f,
          [0, sec(7.5), sec(10.5), walkAt, walkAt + sec(4), total - sec(16), total - sec(4), total],
          [0.0, 0.18, 0.28, 0.3, 0.22, 0.3, 0.42, 0.0],
          clamp
        )
      }
    />
  )
}

const VIEWS: Record<string, React.FC<{len: number}>> = {hook: Hook, problem: Problem, turn: Turn, walk: Walkthrough, why: Why, close: Close}

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: C.ink}}>
    {SCENES.map((s) => {
      const V = VIEWS[s.id]
      return (
        <Sequence key={s.id} from={starts[s.id]} durationInFrames={s.len}>
          <Dissolve len={s.len}>
            <V len={s.len} />
          </Dissolve>
        </Sequence>
      )
    })}
    <Score />
  </AbsoluteFill>
)

const Dissolve: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{opacity: fadeIO(f, len, XF)}}>{children}</AbsoluteFill>
}
