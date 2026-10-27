/**
 * Someone: demo video. 1920x1080, 30 fps, under 3:00.
 * Our own cards + the Lens Studio preview recorded live. No stock, no music.
 * Palette and motion follow the Lens: coral (the pulse), mint (on pace),
 * amber (caution), warm white text; slow fades, one rhythm.
 */
import {loadFont} from "@remotion/google-fonts/Inter"
import React from "react"
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion"
import durations from "../public/narration/durations.json"
import segments from "./segments.json"

const {fontFamily} = loadFont("normal", {weights: ["400", "500", "600"], subsets: ["latin"]})

export const FPS = 30
const C = {
  bg: "#0B0B0C",
  coral: "#FF5A4E",
  mint: "#5CF2B5",
  amber: "#FFC24D",
  white: "#F7F5F2",
  dim: "rgba(247,245,242,0.55)"
}
type NId = keyof typeof durations
const sec = (s: number) => Math.round(s * FPS)
const nar = (id: NId) => sec((durations as Record<string, number>)[id])

// ---- Timeline -------------------------------------------------------------------
type Segment = {
  from: number
  to: number
  rate: number
  label: string
  sub?: string
  nar?: NId
  narDelay?: number
  /** Output seconds (segment-local) where the Lens metronome plays, at 110 per minute. */
  beats?: [number, number]
  /** Output seconds (segment-local) of AED chimes. */
  chimes?: number[]
}
const SEGS = segments as Segment[]
const segFrames = (s: Segment) => Math.round(((s.to - s.from) / s.rate) * FPS)

const SCENES = [
  {id: "cold", len: nar("N1") + sec(1.6)},
  {id: "stats", len: nar("N2") + sec(1.4)},
  {id: "product", len: nar("N3") + sec(1.6)},
  {id: "demo", len: SEGS.reduce((a, s) => a + segFrames(s), 0)},
  {id: "build", len: nar("N9") + sec(2.2)},
  {id: "close", len: nar("N10") + sec(5.5)}
] as const
const startOf = (id: string) => {
  let t = 0
  for (const s of SCENES) {
    if (s.id === id) return t
    t += s.len
  }
  return t
}
export const totalFrames = () => SCENES.reduce((a, s) => a + s.len, 0)

// ---- Motion helpers -----------------------------------------------------------------
const useFade = (inAt: number, len: number, outAt?: number) => {
  const f = useCurrentFrame()
  const a = interpolate(f, [inAt, inAt + len], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
  const b = outAt === undefined ? 1 : interpolate(f, [outAt, outAt + len], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
  return Math.min(a, b)
}
const Rise: React.FC<{at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, out, children, style}) => {
  const f = useCurrentFrame()
  const o = useFade(at, 14, out)
  const y = interpolate(f, [at, at + 18], [14, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
  return <div style={{opacity: o, transform: `translateY(${y}px)`, ...style}}>{children}</div>
}
const Frame: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: C.bg, fontFamily, color: C.white, justifyContent: "center", alignItems: "center"}}>{children}</AbsoluteFill>
)

// The pace ring: the one rhythm, 110 per minute.
const PulseRing: React.FC<{size: number; color?: string}> = ({size, color = C.coral}) => {
  const f = useCurrentFrame()
  const beat = (f / FPS) * (110 / 60)
  const ph = beat - Math.floor(beat)
  const swell = ph < 0.18 ? Math.sin((ph / 0.18) * (Math.PI / 2)) : Math.cos(((ph - 0.18) / 0.82) * (Math.PI / 2))
  const s = 1 + 0.08 * swell
  return (
    <div style={{width: size, height: size, position: "relative", transform: `scale(${s})`}}>
      <div style={{position: "absolute", inset: 0, borderRadius: "50%", border: `${size * 0.035}px solid ${color}`, opacity: 0.85 + 0.15 * swell}} />
      <div style={{position: "absolute", inset: size * 0.3, borderRadius: "50%", background: color, opacity: 0.28}} />
      <div style={{position: "absolute", inset: size * 0.445, borderRadius: "50%", background: color}} />
    </div>
  )
}

// ---- Scenes -------------------------------------------------------------------------
const Cold: React.FC = () => {
  const lines = ["Someone collapses.", "A crowd forms.", "Everyone waits."]
  const f = useCurrentFrame()
  const dots = 9
  return (
    <Frame>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
        {lines.map((l, i) => (
          <Rise key={l} at={sec(0.4 + i * 1.5)}>
            <div style={{fontSize: 76, fontWeight: 600, letterSpacing: -1.5}}>{l}</div>
          </Rise>
        ))}
        <Rise at={sec(4.6)} style={{marginTop: 70}}>
          <div style={{display: "flex", gap: 44}}>
            {Array.from({length: dots}).map((_, i) => (
              <div key={i} style={{width: 22, height: 22, borderRadius: 11, background: C.dim, opacity: 0.55 + 0.1 * Math.sin(f / 20 + i)}} />
            ))}
          </div>
        </Rise>
      </div>
    </Frame>
  )
}

const Stats: React.FC = () => {
  const n = nar("N2")
  const items = [
    {big: "4 in 10", small: "cardiac arrest patients in the US get CPR from a bystander", at: 0.2},
    {big: "37%", small: "of trained bystanders who did not help said they panicked", at: 0.36},
    {big: "10%", small: "less chance of survival for every minute without CPR", at: 0.68}
  ]
  return (
    <Frame>
      <div style={{display: "flex", gap: 110, alignItems: "flex-start"}}>
        {items.map((it, i) => (
          <Rise key={it.big} at={Math.round(sec(0.3) + n * it.at * (i === 0 ? 0 : 1))}>
            <div style={{width: 430}}>
              <div style={{fontSize: 118, fontWeight: 600, color: i === 1 ? C.coral : C.white, letterSpacing: -3}}>{it.big}</div>
              <div style={{fontSize: 32, lineHeight: 1.35, color: C.dim, marginTop: 10}}>{it.small}</div>
            </div>
          </Rise>
        ))}
      </div>
      <Rise at={sec(1)} style={{position: "absolute", bottom: 60}}>
        <div style={{fontSize: 20, color: "rgba(247,245,242,0.38)"}}>CARES 2025 · Swor et al., Acad Emerg Med 2006 · American Red Cross</div>
      </Rise>
    </Frame>
  )
}

const Product: React.FC = () => {
  const pillars = [
    ["Hands free", "both hands on the chest"],
    ["Drawn on the body", "the target sits where you push"],
    ["Shares your view", "911 sees what you see"]
  ]
  return (
    <Frame>
      <Rise at={sec(0.2)}>
        <div style={{display: "flex", alignItems: "center", gap: 44}}>
          <PulseRing size={120} />
          <div>
            <div style={{fontSize: 120, fontWeight: 600, letterSpacing: -4}}>Someone</div>
            <div style={{fontSize: 38, color: C.dim, marginTop: -6}}>A Lens for Snap Specs. Be the someone.</div>
          </div>
        </div>
      </Rise>
      <div style={{position: "absolute", bottom: 170, display: "flex", gap: 120}}>
        {pillars.map(([a, b], i) => (
          <Rise key={a} at={sec(3.2 + i * 0.9)}>
            <div style={{width: 380, borderTop: `2px solid ${C.mint}`, paddingTop: 22}}>
              <div style={{fontSize: 38, fontWeight: 600}}>{a}</div>
              <div style={{fontSize: 28, color: C.dim, marginTop: 6}}>{b}</div>
            </div>
          </Rise>
        ))}
      </div>
    </Frame>
  )
}

const Demo: React.FC = () => {
  let t = 0
  const parts = SEGS.map((s, i) => {
    const len = segFrames(s)
    const from = t
    t += len
    return {s, from, len, i}
  })
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily, color: C.white}}>
      {parts.map(({s, from, len, i}) => (
        <Sequence key={i} from={from} durationInFrames={len}>
          <DemoPart seg={s} len={len} />
          {s.nar ? (
            <Sequence from={sec(s.narDelay ?? 0.3)}>
              <Audio src={staticFile(`narration/${s.nar}.wav`)} />
            </Sequence>
          ) : null}
          {s.beats ? <Beats from={s.beats[0]} to={s.beats[1]} /> : null}
          {(s.chimes ?? []).map((c) => (
            <Sequence key={c} from={sec(c)} durationInFrames={sec(2)}>
              <Audio src={staticFile("SomeoneAEDChime.wav")} volume={0.35} />
            </Sequence>
          ))}
        </Sequence>
      ))}
      <div style={{position: "absolute", left: 1140, bottom: 64, fontSize: 21, color: "rgba(247,245,242,0.42)", lineHeight: 1.5, width: 700}}>
        Lens Studio preview, recorded live. Stand-ins: a manikin for the person; in the preview a pinch on the target stands in for a push (tracked hands on Specs); scripted dispatcher, AED and shock.
      </div>
    </AbsoluteFill>
  )
}

/** The Lens metronome (same file), 110 per minute, under the narration. */
const Beats: React.FC<{from: number; to: number}> = ({from, to}) => {
  const period = 60 / 110
  const n = Math.floor((to - from) / period)
  return (
    <>
      {Array.from({length: n}).map((_, i) => (
        <Sequence key={i} from={sec(from + i * period)} durationInFrames={sec(0.3)}>
          <Audio src={staticFile("SomeoneMetronome.wav")} volume={0.22} />
        </Sequence>
      ))}
    </>
  )
}

const DemoPart: React.FC<{seg: Segment; len: number}> = ({seg, len}) => {
  const o = useFade(0, 8, len - 8)
  return (
    <AbsoluteFill>
      {/* The top strip of the recording (LEAF's run status) is cropped away. */}
      <div style={{position: "absolute", left: 90, top: 75, width: 990, height: 930, overflow: "hidden", borderRadius: 18}}>
        <OffthreadVideo
          src={staticFile("footage/demo.mp4")}
          startFrom={sec(seg.from)}
          playbackRate={seg.rate}
          muted
          style={{position: "absolute", left: 0, bottom: 0, width: 990, height: 1007}}
        />
      </div>
      <div style={{position: "absolute", left: 1140, top: 380, width: 690, opacity: o}}>
        <div style={{fontSize: 54, fontWeight: 600, letterSpacing: -1, lineHeight: 1.15}}>{seg.label}</div>
        {seg.sub ? <div style={{fontSize: 30, color: C.dim, marginTop: 18, lineHeight: 1.4}}>{seg.sub}</div> : null}
        {seg.rate > 1.05 ? <div style={{fontSize: 22, color: "rgba(247,245,242,0.38)", marginTop: 24}}>{`${seg.rate}x`}</div> : null}
      </div>
    </AbsoluteFill>
  )
}

const Build: React.FC = () => {
  const tests = [
    "Pinching the target starts compressions",
    "100 to 120 per minute turns the ring mint",
    "Only one instruction at a time",
    "AED prompt and chime at 1:30",
    "Replay counts are exact",
    "Hand-tracked strokes count, tremor does not",
    "Dispatcher never cut, prompts never stack"
  ]
  const shot = (file: string, caption: string, at: number) => (
    <Rise at={at}>
      <img src={staticFile(`shots/${file}`)} style={{width: 740, borderRadius: 12, display: "block", boxShadow: "0 20px 60px rgba(0,0,0,0.6)"}} />
      <div style={{fontSize: 24, color: C.dim, marginTop: 14}}>{caption}</div>
    </Rise>
  )
  return (
    <Frame>
      <div style={{display: "flex", gap: 90, alignItems: "center"}}>
        <div style={{display: "flex", flexDirection: "column", gap: 34}}>
          {shot("agent.png", "Planned with plan-lens, built by a coding agent through CLAD and the Lens Studio MCP", sec(0.3))}
          {shot("lensstudio.png", "Lens Studio 5.24: scene, preview and logs the agent reads after every change", sec(2.0))}
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 20}}>
          {tests.map((t, i) => (
            <Rise key={t} at={sec(4.2 + i * 0.45)}>
              <div style={{display: "flex", alignItems: "center", gap: 20, fontSize: 30}}>
                <span style={{color: C.mint, fontWeight: 600}}>PASS</span>
                <span>{t}</span>
              </div>
            </Rise>
          ))}
          <Rise at={sec(7.8)}>
            <div style={{fontSize: 30, color: C.mint, marginTop: 16, fontWeight: 600}}>7 of 7 LEAF scenarios pass</div>
          </Rise>
        </div>
      </div>
    </Frame>
  )
}

const Close: React.FC = () => (
  <Frame>
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 70}}>
      <PulseRing size={150} />
      <div style={{textAlign: "center"}}>
        <Rise at={sec(0.4)}>
          <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1}}>In a crowd, everyone waits.</div>
        </Rise>
        <Rise at={sec(1.9)}>
          <div style={{fontSize: 64, fontWeight: 600, letterSpacing: -1, color: C.mint}}>You won't.</div>
        </Rise>
        <Rise at={sec(3.8)} style={{marginTop: 60}}>
          <div style={{fontSize: 34, color: C.dim}}>Someone. Be the someone.</div>
        </Rise>
      </div>
    </div>
  </Frame>
)

const SCENE_VIEW: Record<string, React.FC> = {cold: Cold, stats: Stats, product: Product, demo: Demo, build: Build, close: Close}
const SCENE_NAR: Record<string, NId | null> = {cold: "N1", stats: "N2", product: "N3", demo: null, build: "N9", close: "N10"}

export const Video: React.FC = () => {
  useVideoConfig()
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {SCENES.map((s) => {
        const View = SCENE_VIEW[s.id]
        const n = SCENE_NAR[s.id]
        return (
          <Sequence key={s.id} from={startOf(s.id)} durationInFrames={s.len}>
            <SceneFade len={s.len}>
              <View />
            </SceneFade>
            {n ? (
              <Sequence from={sec(s.id === "close" ? 0.4 : 0.5)}>
                <Audio src={staticFile(`narration/${n}.wav`)} />
              </Sequence>
            ) : null}
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

const SceneFade: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const o = useFade(0, 12, len - 12)
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>
}
