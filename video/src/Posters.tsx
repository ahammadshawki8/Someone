/**
 * Someone: Devpost posters. 1800x1200 (3:2) stills in the film's brand.
 * Render: npx remotion still src/index.ts <id> out/posters/<id>.png
 */
import {loadFont} from "@remotion/google-fonts/Inter"
import React from "react"
import {AbsoluteFill} from "remotion"

const {fontFamily} = loadFont("normal", {weights: ["400", "500", "600"], subsets: ["latin"]})

export const POSTER_W = 1800
export const POSTER_H = 1200

const C = {
  ink: "#0B0B0C",
  panel: "#141416",
  line: "rgba(247,245,242,0.12)",
  coral: "#FF5A4E",
  mint: "#5CF2B5",
  amber: "#FFC24D",
  white: "#F7F5F2",
  slate: "#8A8F98",
  dim: "rgba(247,245,242,0.66)"
}

// ---- Shared frame ----------------------------------------------------------------------
const Mark: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="15" fill="none" stroke={C.coral} strokeWidth="3" />
    <circle cx="20" cy="20" r="5" fill={C.coral} />
  </svg>
)

const Frame: React.FC<{kicker: string; title: React.ReactNode; source?: string; children: React.ReactNode}> = ({
  kicker,
  title,
  source,
  children
}) => (
  <AbsoluteFill style={{background: C.ink, color: C.white, fontFamily, padding: "72px 84px 56px"}}>
    <div style={{fontSize: 22, letterSpacing: 4, color: C.coral, fontWeight: 600}}>{kicker}</div>
    <div style={{fontSize: 54, fontWeight: 600, lineHeight: 1.12, marginTop: 14, maxWidth: 1500}}>{title}</div>
    <div style={{flex: 1, display: "flex", flexDirection: "column", marginTop: 44}}>{children}</div>
    <div style={{display: "flex", alignItems: "center", gap: 14, marginTop: 28, borderTop: `1px solid ${C.line}`, paddingTop: 22}}>
      <Mark size={30} />
      <div style={{fontSize: 22, fontWeight: 600}}>someone</div>
      <div style={{fontSize: 18, color: C.slate, marginLeft: 18, flex: 1}}>{source}</div>
    </div>
  </AbsoluteFill>
)

const Card: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <div style={{background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, padding: "30px 32px", ...style}}>{children}</div>
)

const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.slate}) => (
  <div style={{fontSize: 18, letterSpacing: 3, color, fontWeight: 600}}>{children}</div>
)

// ---- 1. The problem in numbers ---------------------------------------------------------
const STATS = [
  {v: "263,700", c: C.white, t: "EMS-treated out-of-hospital cardiac arrests in the US each year"},
  {v: "10.5%", c: C.coral, t: "survive to hospital discharge"},
  {v: "41.7%", c: C.amber, t: "receive CPR from a bystander before help arrives"},
  {v: "37.5%", c: C.coral, t: "of CPR-trained bystanders who did not act said they panicked"}
]

export const PosterProblem: React.FC = () => {
  const minutes = Array.from({length: 11}, (_, i) => i)
  return (
    <Frame
      kicker="THE PROBLEM"
      title={
        <>
          The barrier is not knowledge. <span style={{color: C.coral}}>It is the freeze.</span>
        </>
      }
      source="Sources: AHA 2025 Guidelines (CARES 2024 data); Swor et al., Acad Emerg Med 2006; American Red Cross; Lee et al., Resuscitation 2020."
    >
      <div style={{display: "flex", gap: 24}}>
        {STATS.map((s) => (
          <Card key={s.v} style={{flex: 1, padding: "34px 30px"}}>
            <div style={{fontSize: 74, fontWeight: 600, color: s.c, letterSpacing: -1}}>{s.v}</div>
            <div style={{fontSize: 24, color: C.dim, marginTop: 10, lineHeight: 1.35}}>{s.t}</div>
          </Card>
        ))}
      </div>
      <div style={{display: "flex", gap: 24, marginTop: 24, flex: 1}}>
        <Card style={{flex: 1.35, display: "flex", flexDirection: "column"}}>
          <Label>EVERY MINUTE COUNTS</Label>
          <div style={{fontSize: 26, marginTop: 10, color: C.dim}}>Chance of survival falls about 10% for every minute without CPR and defibrillation.</div>
          <div style={{flex: 1, display: "flex", alignItems: "flex-end", gap: 14, marginTop: 24}}>
            {minutes.map((m) => {
              const pct = Math.max(0, 100 - m * 10)
              return (
                <div key={m} style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end"}}>
                  <div style={{fontSize: 17, color: C.dim, marginBottom: 6}}>{pct > 0 ? pct + "%" : ""}</div>
                  <div style={{width: "100%", height: `${Math.max(pct, 1.5) * 0.82}%`, background: C.coral, opacity: 0.25 + 0.75 * (pct / 100), borderRadius: 6}} />
                  <div style={{fontSize: 18, color: C.slate, marginTop: 8}}>{m}</div>
                </div>
              )
            })}
          </div>
          <div style={{fontSize: 17, color: C.slate, marginTop: 8, textAlign: "center"}}>minutes after collapse (relative chance, simplified)</div>
        </Card>
        <Card style={{flex: 1, display: "flex", flexDirection: "column"}}>
          <Label>A DISPATCHER WHO CAN SEE HELPS</Label>
          <div style={{fontSize: 26, marginTop: 10, color: C.dim}}>Survival to discharge with dispatcher-guided CPR, Seoul, 1,720 patients.</div>
          <div style={{flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 34}}>
            {[
              {k: "Audio instructions", v: 8.9, c: C.slate},
              {k: "Video instructions", v: 14.3, c: C.mint}
            ].map((b) => (
              <div key={b.k}>
                <div style={{display: "flex", justifyContent: "space-between", fontSize: 24}}>
                  <span>{b.k}</span>
                  <span style={{color: b.c, fontWeight: 600, fontSize: 34}}>{b.v}%</span>
                </div>
                <div style={{height: 26, background: "rgba(247,245,242,0.06)", borderRadius: 13, marginTop: 10}}>
                  <div style={{width: `${(b.v / 16) * 100}%`, height: "100%", background: b.c, borderRadius: 13}} />
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize: 18, color: C.slate}}>Lee et al., Resuscitation 2020 (observed rates).</div>
        </Card>
      </div>
    </Frame>
  )
}

// ---- 2. Research to design -------------------------------------------------------------
const ROWS = [
  {
    f: "37.5% of CPR-trained bystanders who did not act said they panicked; 9.1% feared doing it wrong.",
    s: "Swor et al., Acad Emerg Med 2006",
    d: "One calm instruction at a time. No menus, no dashboards, big pinch targets."
  },
  {
    f: "The more people present, the less likely any one of them helps (diffusion of responsibility).",
    s: "Darley and Latane, J Pers Soc Psychol 1968",
    d: "The AED step never says \"send someone\". It says: point at one person."
  },
  {
    f: "Video-instructed dispatcher CPR: 14.3% survival to discharge vs 8.9% with audio only.",
    s: "Lee et al., Resuscitation 2020",
    d: "The dispatcher sees what you see. A mint frame marks the moment the view is shared."
  },
  {
    f: "Real-time AR feedback improves CPR over no feedback.",
    s: "Cheng et al., Resusc Plus 2024 (systematic review)",
    d: "A pace ring on the chest turns mint at 100 to 120 per minute, with \"Faster.\" or \"Slower.\""
  },
  {
    f: "Bystander CPR raises survival (OR 1.72, 253,247 cases). Guidelines: 100 to 120 per minute, swap every 2 minutes.",
    s: "Chen et al., Emerg Med Int 2025; AHA 2025 Guidelines",
    d: "A 110 bpm beat from the chest, a swap prompt at 2:00, and time to first push in the replay."
  }
]

export const PosterResearch: React.FC = () => (
  <Frame
    kicker="RESEARCH TO DESIGN"
    title="Every design decision traces back to a study."
    source="Prior AR work (Cheng 2024; Sun et al., BMC Med Educ 2024; Abo-Zahhad et al., BioData Min 2025) targets technique and detection. Someone targets the freeze."
  >
    <div style={{display: "grid", gridTemplateColumns: "1.25fr 0.8fr 1.25fr", columnGap: 34, rowGap: 0, fontSize: 26, lineHeight: 1.36}}>
      <Label>WHAT THE RESEARCH FOUND</Label>
      <Label>SOURCE</Label>
      <Label color={C.mint}>WHAT SOMEONE DOES</Label>
      {ROWS.map((r, i) => (
        <React.Fragment key={i}>
          <div style={{borderTop: `1px solid ${C.line}`, padding: "22px 0", marginTop: i === 0 ? 18 : 0}}>{r.f}</div>
          <div style={{borderTop: `1px solid ${C.line}`, padding: "22px 0", color: C.slate, fontSize: 23, marginTop: i === 0 ? 16 : 0}}>{r.s}</div>
          <div style={{borderTop: `1px solid ${C.line}`, padding: "22px 0", marginTop: i === 0 ? 18 : 0, display: "flex", gap: 14}}>
            <span style={{color: C.mint, fontWeight: 600}}>{"->"}</span>
            <span>{r.d}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  </Frame>
)

// ---- 3. Build pipeline -----------------------------------------------------------------
const Stage: React.FC<{n: string; name: string; tool: string; color: string; items: string[]; chips?: string[]}> = ({
  n,
  name,
  tool,
  color,
  items,
  chips
}) => (
  <Card style={{flex: 1, display: "flex", flexDirection: "column", borderTop: `4px solid ${color}`}}>
    <div style={{fontSize: 18, color: C.slate, letterSpacing: 3, fontWeight: 600}}>{n}</div>
    <div style={{fontSize: 40, fontWeight: 600, marginTop: 6, color}}>{name}</div>
    <div style={{fontSize: 24, marginTop: 8}}>{tool}</div>
    <div style={{marginTop: 18, display: "flex", flexDirection: "column", gap: 12}}>
      {items.map((t) => (
        <div key={t} style={{fontSize: 21, color: C.dim, lineHeight: 1.35, display: "flex", gap: 10}}>
          <span style={{color}}>-</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
    {chips ? (
      <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18}}>
        {chips.map((c) => (
          <div key={c} style={{fontSize: 16, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.white, fontFamily: "Consolas, monospace"}}>
            {c}
          </div>
        ))}
      </div>
    ) : null}
  </Card>
)

const Arrow: React.FC = () => (
  <div style={{display: "flex", alignItems: "center", color: C.slate, fontSize: 40, padding: "0 4px"}}>{"›"}</div>
)

export const PosterPipeline: React.FC = () => (
  <Frame
    kicker="HOW WE BUILT IT"
    title={
      <>
        Plan, build, run, test: <span style={{color: C.mint}}>the whole Lens made through Snap's agent tooling.</span>
      </>
    }
    source="Lens Studio 5.24.1, SPECS 27 preview. 29 TypeScript components, about 3,600 lines. 8 LEAF scenarios passing."
  >
    <div style={{display: "flex", gap: 10, flex: 1}}>
      <Stage
        n="01"
        name="Plan"
        tool="plan-lens skill"
        color={C.amber}
        items={["One-question-at-a-time interview", "Checked against AR design rules and preview limits", "design-brief.md, status approved", "5 done criteria, each testable in the preview"]}
      />
      <Arrow />
      <Stage
        n="02"
        name="Build"
        tool="Claude Code + CLAD, via the Lens Studio MCP"
        color={C.coral}
        items={["Wrote every component, wired the scene, imported assets", "Recompiled and read runtime logs after each change", "Walked each beat from the user's eye, fixed what it saw"]}
        chips={["scene-graphql", "ExecuteEditorCode", "RecompileTypeScriptTool", "RunAndCollectLogsTool", "PreviewInteractTool", "MovePreviewCamera", "CapturePanelScreenshotTool"]}
      />
      <Arrow />
      <Stage
        n="03"
        name="Run"
        tool="The Lens on SPECS"
        color={C.white}
        items={["Spectacles Interaction Kit: tracked palms and pinch", "Spectacles UI Kit: the instruction card and replay", "Spatial audio at the chest and toward the AED", "Runtime meshes built in real centimetres"]}
      />
      <Arrow />
      <Stage
        n="04"
        name="Test"
        tool="LEAF in the preview"
        color={C.mint}
        items={["run_leaf_scenario drives real SIK pinches", "One scenario per done criterion", "Plus hand-tracked strokes, flow rules, and the full rescue end to end"]}
        chips={["8 of 8 pass"]}
      />
    </div>
    <div style={{marginTop: 22, display: "flex", alignItems: "center", gap: 16, fontSize: 22, color: C.dim}}>
      <div style={{width: 46, height: 2, background: C.mint}} />
      See and fix loop: screenshots and test failures go back to the agent, which edits, recompiles and re-runs until the beat reads right.
    </div>
  </Frame>
)

// ---- 4. Runtime architecture -----------------------------------------------------------
const Box: React.FC<{title: string; sub?: string; color?: string; style?: React.CSSProperties}> = ({title, sub, color = C.white, style}) => (
  <div style={{border: `1px solid ${C.line}`, borderLeft: `4px solid ${color}`, background: C.panel, borderRadius: 12, padding: "14px 18px", ...style}}>
    <div style={{fontSize: 23, fontWeight: 600}}>{title}</div>
    {sub ? <div style={{fontSize: 18, color: C.dim, marginTop: 4, lineHeight: 1.3}}>{sub}</div> : null}
  </div>
)

const Col: React.FC<{label: string; children: React.ReactNode; flex?: number}> = ({label, children, flex = 1}) => (
  <div style={{flex, display: "flex", flexDirection: "column", gap: 14}}>
    <Label>{label}</Label>
    {children}
  </div>
)

export const PosterRuntime: React.FC = () => {
  const lo = 80
  const hi = 140
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100
  const bands = [
    {a: 80, b: 90, c: C.coral, t: "Faster."},
    {a: 90, b: 100, c: C.amber, t: ""},
    {a: 100, b: 120, c: C.mint, t: "On pace"},
    {a: 120, b: 130, c: C.amber, t: ""},
    {a: 130, b: 140, c: C.coral, t: "Slower."}
  ]
  return (
    <Frame
      kicker="RUNTIME ARCHITECTURE"
      title={
        <>
          One state machine is the single source of truth. <span style={{color: C.slate}}>Every view is passive.</span>
        </>
      }
      source="Pure-logic core (no scene access) so LEAF can test it directly. Views subscribe to state machine events and never decide flow."
    >
      <div style={{flex: 1, display: "flex", flexDirection: "column", justifyContent: "center"}}>
      <div style={{display: "flex", gap: 30, alignItems: "stretch"}}>
        <Col label="INPUT">
          <Box style={{padding: "18px 20px"}} title="SIK HandInputData" sub="tracked palms near the sternum" color={C.coral} />
          <Box title="StrokeDetector" sub="2 cm push counts, 1.5 cm recoil re-arms, tremor ignored" color={C.coral} />
          <Box title="SIK Interactable" sub="pinch: buttons, and the push stand-in in the preview" />
          <Box title="CollapseClock" sub="time since collapse drives AED and swap prompts" />
        </Col>
        <div style={{display: "flex", alignItems: "center", fontSize: 44, color: C.slate}}>{"›"}</div>
        <Col label="CORE" flex={1.05}>
          <Box title="RescueStateMachine" sub="11 states, one card at a time, timed prompts queue behind an unanswered one" color={C.mint} style={{padding: "22px 20px"}} />
          <Box title="CompressionTracker" sub="rolling rate over the last 5 intervals; a long pause restarts the window" color={C.mint} />
          <Box title="SessionStats" sub="total, % on pace, best streak, time to first push" color={C.mint} />
        </Col>
        <div style={{display: "flex", alignItems: "center", fontSize: 44, color: C.slate}}>{"›"}</div>
        <Col label="OUTPUT" flex={1.25}>
          <Box title="On the body" sub="chest target, pace ring, push ripple, chest blend shape, AED pads, floor halo" color={C.coral} />
          <Box title="In the glance" sub="UI Kit card, clock chip, view-share frame, replay" color={C.white} />
          <Box title="Spatial audio" sub="110 bpm metronome at the chest, AED chime from its direction, dispatcher voice with captions" color={C.amber} />
        </Col>
      </div>
      </div>
      <Card style={{marginTop: 28, padding: "24px 32px"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline"}}>
          <Label>RATE SCORING (COMPRESSIONS PER MINUTE)</Label>
          <div style={{fontSize: 20, color: C.dim}}>Guideline band 100 to 120, AHA 2025</div>
        </div>
        <div style={{position: "relative", height: 44, marginTop: 18, borderRadius: 10, overflow: "hidden", display: "flex"}}>
          {bands.map((b) => (
            <div key={b.a} style={{width: `${x(b.b) - x(b.a)}%`, background: b.c, opacity: b.c === C.mint ? 0.95 : 0.7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.ink, fontWeight: 600}}>
              {b.t}
            </div>
          ))}
        </div>
        <div style={{position: "relative", height: 26, marginTop: 8}}>
          {[80, 90, 100, 110, 120, 130, 140].map((v) => (
            <div key={v} style={{position: "absolute", left: `${x(v)}%`, transform: "translateX(-50%)", fontSize: 19, color: v === 110 ? C.white : C.slate, fontWeight: v === 110 ? 600 : 400}}>
              {v === 110 ? "110 beat" : v}
            </div>
          ))}
        </div>
      </Card>
    </Frame>
  )
}

// ---- 5. The rescue flow ----------------------------------------------------------------
const STEPS = [
  {s: "Collapse", c: "Someone collapsed.", a: "I see someone", col: C.coral},
  {s: "Check", c: "Tap their shoulder. Are they breathing?", a: "Not breathing", col: C.white},
  {s: "Call", c: "Get help now.", a: "Call 911, dispatcher connects", col: C.white},
  {s: "Place hands", c: "Push here.", a: "Hands on the chest", col: C.coral},
  {s: "Compress", c: "Push hard and fast.", a: "Ring scores every push", col: C.mint},
  {s: "AED", c: "AED, 40 m. Point at one person.", a: "at 1:30, chime and arrow", col: C.amber},
  {s: "Swap", c: "Switch with a helper if you can.", a: "at 2:00, scoring pauses", col: C.white},
  {s: "Pads", c: "The AED is here. Pads go here.", a: "Pads shown on the chest", col: C.amber},
  {s: "Stand clear", c: "Stand clear.", a: "Simulated shock, then resume", col: C.amber},
  {s: "Help arrives", c: "Help is here.", a: "Handover", col: C.white},
  {s: "Replay", c: "You did not freeze.", a: "Compressions, % on pace, streak, first push", col: C.mint}
]

export const PosterFlow: React.FC = () => {
  const rows = [STEPS.slice(0, 6), STEPS.slice(6)]
  return (
    <Frame
      kicker="THE RESCUE, ONE CARD AT A TIME"
      title="Eleven states. Exactly one instruction on screen in each."
      source="Timers shown are real defaults; demo mode shortens them for the video. Verified by LEAF done criterion 3 across the whole flow."
    >
      <div style={{display: "flex", flexDirection: "column", gap: 34, flex: 1, justifyContent: "center"}}>
        {rows.map((row, ri) => (
          <div key={ri} style={{display: "flex", gap: 14, alignItems: "stretch"}}>
            {row.map((st, i) => {
              const n = ri * 6 + i + 1
              return (
                <React.Fragment key={st.s}>
                  <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
                    <div style={{display: "flex", alignItems: "center", gap: 12}}>
                      <div style={{width: 36, height: 36, borderRadius: 18, border: `2px solid ${st.col}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 600, color: st.col}}>
                        {n}
                      </div>
                      <div style={{fontSize: 21, letterSpacing: 2, fontWeight: 600, color: st.col}}>{st.s.toUpperCase()}</div>
                    </div>
                    <Card style={{marginTop: 14, flex: 1, padding: "22px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 250}}>
                      <div style={{fontSize: 27, fontWeight: 600, lineHeight: 1.25}}>{st.c}</div>
                      <div style={{fontSize: 19, color: C.dim, marginTop: 16, lineHeight: 1.3}}>{st.a}</div>
                    </Card>
                  </div>
                  {i < row.length - 1 ? <div style={{display: "flex", alignItems: "center", color: C.slate, fontSize: 34, paddingTop: 50}}>{"›"}</div> : null}
                </React.Fragment>
              )
            })}
            {ri === 1 ? <div style={{flex: 1.1}} /> : null}
          </div>
        ))}
      </div>
    </Frame>
  )
}
