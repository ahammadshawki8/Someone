/**
 * Someone: animated Devpost thumbnail. The poster stays still; only small
 * regions move, so the GIF stays light: a push of the hands on every beat
 * (110 per minute), a ripple from the chest target, the pace gauge glowing on
 * the beat, the 911 dot blinking and the AED chevron nudging.
 * 22 fps = 12 frames per beat = 110 bpm. 6 beats per seamless loop.
 */
import React from "react"
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion"

export const THUMB_FPS = 22
export const THUMB_BEAT = 12
export const THUMB_FRAMES = THUMB_BEAT * 6
export const THUMB_W = 900
export const THUMB_H = 600

// Source poster is 1448 x 1086. Scale to the thumbnail width and crop to 3:2.
const SRC_W = 1448
const SRC_H = 1086
const K = THUMB_W / SRC_W
const OFFSET_Y = -40 // px in thumbnail space (crops 40 px top, about 35 px bottom)
const sx = (x: number) => x * K
const sy = (y: number) => y * K + OFFSET_Y

const MINT = "#5CF2B5"
const CORAL = "#FF5A4E"

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const

/** 0..1 push depth within a beat: fast press, slower recoil. */
const push = (b: number) => {
  if (b < 2) return interpolate(b, [0, 2], [0, 1], {...clamp, easing: Easing.out(Easing.quad)})
  return interpolate(b, [2, 7], [1, 0], {...clamp, easing: Easing.inOut(Easing.sin)})
}

const Base: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <Img
    src={staticFile("thumb/poster.png")}
    style={{position: "absolute", left: 0, top: OFFSET_Y, width: THUMB_W, height: SRC_H * K, ...style}}
  />
)

/** A light sweep across one region: the bright text pixels of the poster are
 *  keyed out (alpha = 4G - 3, so white and mint letters only), blurred into a
 *  soft mint glow, and revealed through a moving band. The background is never
 *  touched. Off outside [start, start + dur]. */
const Shine: React.FC<{id: string; f: number; x0: number; y0: number; x1: number; y1: number; start: number; dur: number}> = ({
  id,
  f,
  x0,
  y0,
  x1,
  y1,
  start,
  dur
}) => {
  if (f < start || f > start + dur) return null
  const l = sx(x0)
  const t = sy(y0)
  const w = sx(x1) - l
  const h = sy(y1) - t
  const pos = interpolate(f, [start, start + dur], [-0.3, 1.3], {...clamp, easing: Easing.inOut(Easing.sin)})
  const bx = l + w * pos
  return (
    <g>
      <defs>
        <clipPath id={`clip-${id}`}>
          <rect x={l} y={t} width={w} height={h} />
        </clipPath>
        <filter id={`key-${id}`} x={l - 10} y={t - 10} width={w + 20} height={h + 20} filterUnits="userSpaceOnUse">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 4 0 0 -3" result="txt" />
          <feGaussianBlur in="txt" stdDeviation="4" result="soft" />
          <feFlood floodColor="#9DFFD6" result="tint" />
          <feComposite in="tint" in2="soft" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="txt" />
          </feMerge>
        </filter>
        <linearGradient id={`band-${id}`} gradientUnits="userSpaceOnUse" x1={bx - 70} y1={t} x2={bx + 70} y2={t + h * 0.35}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`mask-${id}`} maskUnits="userSpaceOnUse" x={l - 10} y={t - 10} width={w + 20} height={h + 20}>
          <rect x={l - 10} y={t - 10} width={w + 20} height={h + 20} fill={`url(#band-${id})`} />
        </mask>
      </defs>
      <g clipPath={`url(#clip-${id})`} mask={`url(#mask-${id})`}>
        <image href={staticFile("thumb/poster.png")} x={0} y={OFFSET_Y} width={THUMB_W} height={SRC_H * K} filter={`url(#key-${id})`} />
      </g>
    </g>
  )
}

export const Thumb: React.FC = () => {
  const f = useCurrentFrame()
  const b = f % THUMB_BEAT
  const p = push(b)

  // Hands and forearms: a feathered patch of the poster, shifted down on each push.
  const hx0 = sx(770)
  const hx1 = sx(1000)
  const hy0 = sy(610)
  const hy1 = sy(905)
  const shift = 6 * p
  const mask = "radial-gradient(ellipse 50% 50% at 50% 55%, black 62%, transparent 100%)"

  // Ripple from the chest target, launched at each push.
  const r = interpolate(b, [0, THUMB_BEAT - 1], [0, 1], clamp)
  const cx = sx(880)
  const cy = sy(878)
  const rx = interpolate(r, [0, 1], [sx(150), sx(360)])
  const ry = interpolate(r, [0, 1], [sx(38), sx(98)])
  const ripA = interpolate(r, [0, 0.12, 1], [0, 0.85, 0])

  // Gauge glow on the beat.
  const gx = sx(1050)
  const gy = sy(662)
  const glow = interpolate(b, [0, 2, 8], [0, 1, 0], clamp)

  // 911 dot: on for 4 beats, off for 2 (seamless over the 6-beat loop).
  const dotOn = Math.floor(f / THUMB_BEAT) % 3 !== 2

  // The coral dot in "someone" beats with the pushes, like the brand mark.
  const dx = sx(438.5)
  const dy = sy(301)
  const dr = sx(12.5)
  const beatR = interpolate(b, [0, THUMB_BEAT - 1], [dr * 1.15, dr * 3.1], clamp)
  const beatA = interpolate(b, [0, 1, THUMB_BEAT - 1], [0, 0.9, 0], clamp)

  // AED chevron nudge: once per loop.
  const nudge = interpolate(f, [0, 10, 26, THUMB_FRAMES], [0, 7, 0, 0], {...clamp, easing: Easing.inOut(Easing.sin)})

  return (
    <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
      <Base />

      {/* hands push */}
      <div
        style={{
          position: "absolute",
          left: hx0,
          top: hy0,
          width: hx1 - hx0,
          height: hy1 - hy0,
          overflow: "hidden",
          WebkitMaskImage: mask,
          maskImage: mask
        }}
      >
        <Img
          src={staticFile("thumb/poster.png")}
          style={{position: "absolute", left: -hx0, top: OFFSET_Y - hy0 + shift, width: THUMB_W, height: SRC_H * K}}
        />
      </div>

      <svg width={THUMB_W} height={THUMB_H} style={{position: "absolute", left: 0, top: 0}}>
        {/* chest ripple */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={MINT} strokeWidth={2.4} opacity={ripA} />
        {/* gauge glow */}
        <circle cx={gx} cy={gy} r={sx(78)} fill="none" stroke={MINT} strokeWidth={3} opacity={0.65 * glow} />
        <circle cx={gx} cy={gy} r={sx(92)} fill="none" stroke={MINT} strokeWidth={1.5} opacity={0.35 * glow} />
        {/* chest target flash on the push */}
        <ellipse cx={cx} cy={cy} rx={sx(70)} ry={sx(20)} fill={CORAL} opacity={0.22 * p} />
        {/* 911 dot: cover it when off */}
        {!dotOn ? <circle cx={sx(1158)} cy={sy(222)} r={sx(13)} fill="#25393f" opacity={0.9} /> : null}
      </svg>

      {/* AED chevron nudge: shift a small patch to the right */}
      <div style={{position: "absolute", left: sx(1262), top: sy(462), width: sx(46), height: sx(56), overflow: "hidden"}}>
        <Img
          src={staticFile("thumb/poster.png")}
          style={{position: "absolute", left: -sx(1262) + nudge, top: OFFSET_Y - sy(462), width: THUMB_W, height: SRC_H * K}}
        />
      </div>
      {/* title, tagline and glasses: staggered light sweeps */}
      <svg width={THUMB_W} height={THUMB_H} style={{position: "absolute", left: 0, top: 0}}>
        <Shine id="title" f={f} x0={70} y0={255} x1={630} y1={348} start={0} dur={22} />
        <Shine id="line1" f={f} x0={70} y0={375} x1={495} y1={445} start={14} dur={20} />
        <Shine id="line2" f={f} x0={70} y0={435} x1={375} y1={512} start={24} dur={20} />
        <Shine id="glasses" f={f} x0={140} y0={148} x1={355} y1={230} start={42} dur={18} />
      </svg>

      {/* coral dot heartbeat */}
      <svg width={THUMB_W} height={THUMB_H} style={{position: "absolute", left: 0, top: 0}}>
        <circle cx={dx} cy={dy} r={beatR} fill="none" stroke={CORAL} strokeWidth={2} opacity={beatA} />
        <circle cx={dx} cy={dy} r={dr * (1 + 0.22 * p)} fill={CORAL} opacity={0.9 * p} />
      </svg>
    </AbsoluteFill>
  )
}
