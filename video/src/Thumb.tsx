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
    </AbsoluteFill>
  )
}
