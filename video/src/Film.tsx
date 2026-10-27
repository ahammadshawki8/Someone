/**
 * Someone: the film. 1920x1080, 30 fps, under 3:00.
 * Hook, problem, turn, walkthrough, real-world concept, how we built it, close.
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
  {id: "hook", len: sec(Math.max(17, 9.8 + nar("H1") + 0.8))},
  {id: "problem", len: sec(nar("P1") + 1.0)},
  {id: "turn", len: sec(Math.max(10, nar("S1") + 2.0))},
  {id: "walk", len: WALK.reduce((a, b) => a + beatLen(b), 0)},
  {id: "real", len: sec(nar("R1") + 1.4)},
  {id: "arch", len: sec(nar("A1") + 1.6)},
  {id: "close", len: sec(nar("C1") + 4.5)}
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
      <Sequence from={sec(9.4)} durationInFrames={len - sec(9.4)}>
        <Stock src="stock/crowd.mp4" len={len - sec(9.4)} rate={0.5} dark={0.5} zoom={0.08} />
      </Sequence>
      <Letterbox />
      {/* Time stamp over the ordinary morning */}
      <Rise at={sec(0.5)} out={sec(6.8)} style={{position: "absolute", left: 120, bottom: 120}}>
        <div style={{fontSize: 30, color: C.dim, letterSpacing: 2}}>TUESDAY, 8:42 A.M.</div>
      </Rise>
      {/* The collapse: hard cut to black */}
      {t >= 7.6 && t < 9.4 ? <AbsoluteFill style={{background: "#000"}} /> : null}
      <Rise at={sec(7.9)} out={sec(9.1)} style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{fontSize: 84, fontWeight: 600, letterSpacing: -2}}>Someone collapses.</div>
      </Rise>
      <Rise at={sec(10.0)} out={len - sec(1.2)} style={{position: "absolute", left: 0, right: 0, top: 410, textAlign: "center"}}>
        <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1.5}}>A crowd forms.</div>
      </Rise>
      <Rise at={sec(12.6)} out={len - sec(1.2)} style={{position: "absolute", left: 0, right: 0, top: 500, textAlign: "center"}}>
        <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1.5, color: C.dim}}>Everyone waits for someone else.</div>
      </Rise>
      <Heartbeats from={0.2} to={7.0} period={0.86} volume={0.9} />
      <Sequence from={sec(6.6)} durationInFrames={sec(0.4)}>
        <Audio src={staticFile("sfx/monitor.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={sec(7.6)} durationInFrames={sec(4)}>
        <Audio src={staticFile("sfx/flatline.wav")} volume={0.55} />
      </Sequence>
      <Narration id="H1" at={9.8} />
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
              <Audio src={staticFile("SomeoneAEDChime.wav")} volume={0.6} />
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
          <Audio src={staticFile("SomeoneMetronome.wav")} volume={0.55} />
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

// ---- 5. Real-world concept ------------------------------------------------------------
/** Our Lens UI composited over real CPR footage: what Specs is built to show. */
const RealLife: React.FC<{len: number}> = ({len}) => {
  const f = useCurrentFrame()
  const t = f / FPS
  const beat = (t * (110 / 60)) % 1
  const swell = beat < 0.18 ? Math.sin((beat / 0.18) * (Math.PI / 2)) : Math.cos(((beat - 0.18) / 0.82) * (Math.PI / 2))
  const on = interpolate(f, [sec(0.8), sec(1.6)], [0, 1], clamp)
  const cx = 600
  const cy = 420
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      <Stock src="stock/hands2.mp4" len={len} rate={1} dark={0.18} zoom={0.03} />
      <Letterbox />
      {/* the guide, as Specs draws it on the chest */}
      <svg width={1920} height={1080} style={{position: "absolute", left: 0, top: 0, opacity: on}}>
        <ellipse cx={cx} cy={cy} rx={190 * (1 + 0.06 * swell)} ry={120 * (1 + 0.06 * swell)} fill="none" stroke={C.mint} strokeWidth={7} opacity={0.9} />
        <ellipse cx={cx} cy={cy} rx={78} ry={48} fill={C.coral} opacity={0.32} />
      </svg>
      <div style={{position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: on}}>
        <div style={{fontSize: 20, color: C.mint, letterSpacing: 1}}>Dispatcher connected, viewing</div>
        <div style={{fontSize: 64, fontWeight: 600, marginTop: 16, letterSpacing: -1, textShadow: "0 2px 20px rgba(0,0,0,0.5)"}}>Push hard and fast.</div>
      </div>
      <div style={{position: "absolute", left: cx + 230, top: cy - 30, fontSize: 40, color: C.mint, fontWeight: 600, opacity: on}}>Good.</div>
      <div style={{position: "absolute", left: 140, top: 760, opacity: on}}>
        <div style={{fontSize: 34}}>0:42</div>
        <div style={{fontSize: 18, color: C.dim}}>since collapse</div>
      </div>
      <Rise at={sec(1.2)} style={{position: "absolute", right: 120, top: 330, width: 520}}>
        <div style={{fontSize: 22, color: C.coral, letterSpacing: 3, fontWeight: 600}}>ON REAL SPECS</div>
        <div style={{fontSize: 46, fontWeight: 600, letterSpacing: -1, lineHeight: 1.15, marginTop: 14}}>No taps. No phone. Eyes on the person.</div>
        <div style={{fontSize: 24, color: C.dim, lineHeight: 1.5, marginTop: 18}}>
          Specs hand tracking reads each push from your palms on the chest. The same Lens logic, the same guide, the same voice.
        </div>
      </Rise>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 84, textAlign: "center", fontSize: 17, color: "rgba(247,245,242,0.55)"}}>
        Concept visualization: our Lens graphics composited over real CPR training footage (Pexels). Not a capture from Specs.
      </div>
      <Narration id="R1" at={0.6} />
    </AbsoluteFill>
  )
}

// ---- 6. How we built it ----------------------------------------------------------------
const STAGES = [
  {k: "PLAN", t: "plan-lens skill", d: "interview to design brief, 5 testable rules"},
  {k: "BUILD", t: "Claude Code + CLAD", d: "every script and scene edit through the Lens Studio MCP"},
  {k: "RUN", t: "The Lens", d: "SIK hands, UI Kit, spatial audio, one state machine"},
  {k: "TEST", t: "LEAF", d: "8 scenarios in the preview, all passing"}
]
const MCP_TOOLS = [
  "scene-graphql",
  "ExecuteEditorCode",
  "RecompileTypeScriptTool",
  "RunAndCollectLogsTool",
  "PreviewInteractTool",
  "CapturePanelScreenshotTool",
  "run_leaf_scenario"
]
const CRITERIA = [
  "Pinching the chest target starts compressions; the ring appears on the chest",
  "100 to 120 a minute turns the ring green; slower says Faster, quicker says Slower",
  "Only one instruction card is ever visible",
  "At 1:30 the AED arrow and chime appear; Sent dismisses both",
  "The replay shows the correct count and on-pace percentage"
]
const RUNTIME = [
  ["SIK hand tracking", "palms on the chest"],
  ["Stroke detector", "2 cm push, 1.5 cm recoil"],
  ["Rescue state machine", "single source of truth"],
  ["Target, ring, metronome", "spatial audio from the chest"],
  ["Dispatcher, AED, replay", "captions on every line"]
]
const TESTS = [
  "done-criterion-1 to 5",
  "hand-compression",
  "flow-rules",
  "demo-run (the whole rescue)"
]

const Arch: React.FC<{len: number}> = ({len}) => {
  const f = useCurrentFrame()
  const n = sec(nar("A1"))
  const at = (p: number) => sec(0.6) + Math.round(n * p)
  const marks = [at(0.06), at(0.22), at(0.55), at(0.82)]
  const stage = marks.filter((m) => f >= m).length - 1
  const panelIn = (i: number) => interpolate(f, [marks[i], marks[i] + 12], [0, 1], {...clamp, easing: ease})
  const panelOut = (i: number) => (i < 3 ? interpolate(f, [marks[i + 1] - 8, marks[i + 1] + 4], [1, 0], clamp) : 1)
  const panel = (i: number) => Math.min(panelIn(i), panelOut(i))
  const loop = interpolate(f, [at(0.82), at(0.82) + 30], [0, 1], {...clamp, easing: ease})
  const W = 1560
  const x0 = (1920 - W) / 2
  const colW = W / 4
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      {/* pipeline */}
      <svg width={1920} height={260} style={{position: "absolute", left: 0, top: 60}}>
        {[0, 1, 2].map((i) => {
          const a = x0 + colW * i + colW * 0.82
          const b = x0 + colW * (i + 1) + colW * 0.18
          const p = interpolate(f, [marks[i + 1] - 14, marks[i + 1]], [0, 1], clamp)
          return <line key={i} x1={a} y1={70} x2={a + (b - a) * p} y2={70} stroke={C.slate} strokeWidth={2} />
        })}
        {/* the see-and-fix loop: TEST back to BUILD */}
        <path
          d={`M ${x0 + colW * 3.5} 110 C ${x0 + colW * 3.5} 200, ${x0 + colW * 1.5} 200, ${x0 + colW * 1.5} 110`}
          fill="none"
          stroke={C.mint}
          strokeWidth={2}
          strokeDasharray={900}
          strokeDashoffset={900 * (1 - loop)}
        />
      </svg>
      {STAGES.map((s, i) => {
        const lit = stage >= i
        const cur = stage === i
        return (
          <div key={s.k} style={{position: "absolute", left: x0 + colW * i, top: 70, width: colW, textAlign: "center", opacity: interpolate(f, [marks[i] - 10, marks[i]], [0.25, 1], clamp)}}>
            <div style={{fontSize: 18, letterSpacing: 4, color: cur ? C.coral : lit ? C.white : C.slate, fontWeight: 600}}>{s.k}</div>
            <div style={{fontSize: 30, fontWeight: 600, marginTop: 10}}>{s.t}</div>
            <div style={{fontSize: 18, color: C.dim, marginTop: 6, padding: "0 30px"}}>{s.d}</div>
          </div>
        )
      })}
      <div style={{position: "absolute", left: x0 + colW * 1.5 - 120, top: 262, width: 240 + colW * 2, textAlign: "center", fontSize: 16, color: C.mint, opacity: loop}}>
        see and fix: preview, logs, screenshots, back to the code
      </div>

      {/* stage panels */}
      <div style={{position: "absolute", left: x0, top: 330, width: W, height: 640}}>
        {/* PLAN: the approved brief */}
        <AbsoluteFill style={{opacity: panel(0), padding: "30px 60px", background: "rgba(247,245,242,0.04)", borderRadius: 20}}>
          <div style={{fontSize: 20, color: C.slate}}>devpost/design-brief.md  ·  status: approved</div>
          <div style={{fontSize: 34, fontWeight: 600, marginTop: 18}}>Done criteria, each one checkable in the preview</div>
          {CRITERIA.map((c, i) => (
            <div key={c} style={{display: "flex", gap: 18, fontSize: 26, marginTop: 22, opacity: interpolate(f, [marks[0] + 8 + i * 6, marks[0] + 20 + i * 6], [0, 1], clamp)}}>
              <span style={{color: C.coral, fontWeight: 600}}>{i + 1}</span>
              <span>{c}</span>
            </div>
          ))}
        </AbsoluteFill>
        {/* BUILD: Lens Studio, driven by the agent through the MCP */}
        <AbsoluteFill style={{opacity: panel(1)}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 1120, height: 630, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)"}}>
            <OffthreadVideo src={staticFile("screens/ls_build.mp4")} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
          </div>
          <div style={{position: "absolute", left: 1160, top: 6, width: 400}}>
            <div style={{fontSize: 18, color: C.slate, letterSpacing: 2}}>LENS STUDIO MCP TOOLS USED</div>
            {MCP_TOOLS.map((tl, i) => (
              <div
                key={tl}
                style={{
                  marginTop: 14,
                  fontSize: 22,
                  fontFamily: "Consolas, monospace",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(92,242,181,0.08)",
                  border: "1px solid rgba(92,242,181,0.35)",
                  opacity: interpolate(f, [marks[1] + 10 + i * 7, marks[1] + 22 + i * 7], [0, 1], clamp)
                }}
              >
                {tl}
              </div>
            ))}
          </div>
          <div style={{position: "absolute", left: 0, top: 640, fontSize: 18, color: C.dim}}>Screen recording: Lens Studio while the agent edits the scene and runs the preview through the MCP.</div>
        </AbsoluteFill>
        {/* RUN: the Lens at runtime */}
        <AbsoluteFill style={{opacity: panel(2), alignItems: "center", justifyContent: "center"}}>
          <div style={{display: "flex", alignItems: "center", gap: 18}}>
            {RUNTIME.map(([a, b], i) => (
              <React.Fragment key={a}>
                <div
                  style={{
                    width: 250,
                    padding: "24px 20px",
                    borderRadius: 16,
                    border: `1px solid ${i === 2 ? C.coral : "rgba(247,245,242,0.25)"}`,
                    background: i === 2 ? "rgba(255,90,78,0.08)" : "rgba(247,245,242,0.03)",
                    opacity: interpolate(f, [marks[2] + i * 8, marks[2] + 12 + i * 8], [0, 1], clamp)
                  }}
                >
                  <div style={{fontSize: 24, fontWeight: 600}}>{a}</div>
                  <div style={{fontSize: 18, color: C.dim, marginTop: 8}}>{b}</div>
                </div>
                {i < RUNTIME.length - 1 ? <div style={{color: C.slate, fontSize: 28}}>→</div> : null}
              </React.Fragment>
            ))}
          </div>
        </AbsoluteFill>
        {/* TEST: LEAF going green */}
        <AbsoluteFill style={{opacity: panel(3)}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 1120, height: 630, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)"}}>
            <OffthreadVideo src={staticFile("screens/ls_leaf.mp4")} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
          </div>
          <div style={{position: "absolute", left: 1160, top: 6, width: 400}}>
            <div style={{fontSize: 18, color: C.slate, letterSpacing: 2}}>LEAF SCENARIOS</div>
            {TESTS.map((tl, i) => (
              <div key={tl} style={{display: "flex", gap: 14, marginTop: 18, fontSize: 24, opacity: interpolate(f, [marks[3] + 8 + i * 8, marks[3] + 20 + i * 8], [0, 1], clamp)}}>
                <span style={{color: C.mint, fontWeight: 600}}>PASS</span>
                <span>{tl}</span>
              </div>
            ))}
            <div style={{fontSize: 30, color: C.mint, fontWeight: 600, marginTop: 30, opacity: interpolate(f, [marks[3] + 46, marks[3] + 58], [0, 1], clamp)}}>8 of 8 pass</div>
          </div>
          <div style={{position: "absolute", left: 0, top: 640, fontSize: 18, color: C.dim}}>Screen recording: the LEAF panel running the scenarios in the Lens Studio preview.</div>
        </AbsoluteFill>
      </div>
      <Narration id="A1" at={0.6} />
    </AbsoluteFill>
  )
}

// ---- 7. Close -------------------------------------------------------------------------
const Close: React.FC<{len: number}> = ({len}) => {
  const f = useCurrentFrame()
  const t = f / FPS
  const beat = (t * 1.15) % 1
  const pulse = beat < 0.15 ? Math.sin((beat / 0.15) * Math.PI) : 0
  const black = sec(8.2)
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, color: C.white}}>
      <Sequence durationInFrames={sec(4.6)}>
        <Stock src="stock/hands.mp4" len={sec(4.6)} rate={0.8} dark={0.45} zoom={0.06} />
        <Letterbox />
        <Rise at={sec(0.4)} style={{position: "absolute", left: 0, right: 0, top: 440, textAlign: "center"}}>
          <div style={{fontSize: 60, fontWeight: 600, letterSpacing: -1.2}}>Immediate CPR can double, even triple,</div>
          <div style={{fontSize: 60, fontWeight: 600, letterSpacing: -1.2}}>the chance of survival.</div>
          <div style={{fontSize: 20, color: C.dim, marginTop: 18}}>American Heart Association</div>
        </Rise>
      </Sequence>
      <Sequence from={sec(4.4)} durationInFrames={sec(4.0)}>
        <Stock src="stock/station.mp4" len={sec(4.0)} rate={0.5} dark={0.55} zoom={0.07} />
        <Letterbox />
        <Rise at={sec(0.3)} style={{position: "absolute", left: 0, right: 0, top: 470, textAlign: "center"}}>
          <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1.5}}>The difference is one person who moves.</div>
        </Rise>
      </Sequence>
      <Sequence from={black}>
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", opacity: interpolate(f - black, [0, 14], [0, 1], clamp)}}>
          <div style={{transform: `translateY(${interpolate(f, [black + sec(2.4), black + sec(3.2)], [0, -100], {...clamp, easing: ease})}px)`}}>
            <Mark size={180} pulse={pulse} />
          </div>
          <Rise at={sec(0.6)} style={{position: "absolute", top: 600, left: 0, right: 0, textAlign: "center"}}>
            <div style={{fontSize: 70, fontWeight: 600, letterSpacing: -1.6}}>
              Be the someone who <span style={{color: C.mint}}>moves first.</span>
            </div>
          </Rise>
          <Rise at={sec(3.0)} style={{position: "absolute", top: 735, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14}}>
            <Wordmark size={54} color={C.dim} />
            <div style={{fontSize: 20, color: C.slate}}>A Lens for Snap Specs, built with Lens Studio, CLAD and LEAF</div>
          </Rise>
        </AbsoluteFill>
      </Sequence>
      <Rise at={len - sec(3.2)} style={{position: "absolute", bottom: 26, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 14, color: "rgba(247,245,242,0.45)", lineHeight: 1.6}}>
          Stock footage: Pexels and Mixkit contributors, used under their free licenses. Music: "Silent Descent", Mixkit. Narration: Kokoro-82M text to speech.
          <br />
          Someone is a design concept and practice tool, not a medical device. Take a certified CPR course.
        </div>
      </Rise>
      <Heartbeats from={0.2} to={len / FPS - 0.8} period={0.87} volume={0.55} />
      <Narration id="C1" at={0.4} />
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
          [0, sec(7.5), sec(10.5), walkAt - sec(1), walkAt + sec(2), starts.real, starts.real + sec(2), total - sec(15), total - sec(4), total],
          [0.0, 0.18, 0.26, 0.26, 0.07, 0.07, 0.2, 0.22, 0.4, 0.0],
          clamp
        )
      }
    />
  )
}

const VIEWS: Record<string, React.FC<{len: number}>> = {hook: Hook, problem: Problem, turn: Turn, walk: Walkthrough, real: RealLife, arch: Arch, close: Close}

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
