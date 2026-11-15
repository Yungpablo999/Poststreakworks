import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { BotEngine, type BotFrame } from '../bloub/engine';
import { EXPRESSION_BY_ID } from '../bloub/expressions';
import { NOTIF_BLUE } from '../bloub/decor';
import { DEMI_VIEWBOX, RAYON } from '../bloub/repere';
import { COLOR_BY_ID, SHAPE_BY_ID, mixHex } from '../bloub/skins';
import type { StateId } from '../bloub/states';

// Bloub (github.com/jeremy-prt/bloub, MIT): Jarvis's face. The engine in
// src/bloub is the original, untouched; this file only draws its frames with
// react-native-svg, the same way the original BloubBot.vue does: the body is
// filled through a mask, so the eyes are real holes, plus the orbit rings,
// particles and notification dot some states use.
//
// The engine is a pure function of time, so it handles everything itself:
// breathing, blinking, the eyes wandering, and the morph between states
// (idle, thinking, wink, wide, alert, sleep, orbit…) and expressions
// (neutre, heureux, excite, somnolent…). Reduce Motion draws one still frame.

export type BloubState = StateId;
export type BloubExpression =
  | 'neutre' | 'attentif' | 'surpris' | 'excite' | 'heureux' | 'hilare' | 'colere' | 'triste'
  | 'effraye' | 'mefiant' | 'confus' | 'curieux' | 'fier' | 'timide' | 'blase' | 'somnolent';
export type BloubShape = 'cercle' | 'galet' | 'squircle' | 'capsule' | 'triangle' | 'hexagone' | 'nuage' | 'goutte';

const R = RAYON;
const VB = DEMI_VIEWBOX;
/** Just around the body: for small icons, so the face fills the box */
const TIGHT = 112;

let seq = 0;

export function Bloub({
  size = 32,
  state = 'idle',
  expression = 'attentif',
  shape = 'squircle',
  color = 'violet',
  paper,
  framed = 'tight',
  animated = true,
}: {
  size?: number;
  /** The engine state: idle, thinking, wink, wide, alert, notify, exclaim, sleep, orbit… */
  state?: BloubState;
  /** Resting face for idle-type states */
  expression?: BloubExpression;
  shape?: BloubShape;
  /** A Bloub colour id ('violet') or any hex */
  color?: string;
  /** What shows through the eyes. Omit to see the real background through them. */
  paper?: string;
  /** 'tight' crops to the body (icons); 'full' leaves room for rings and the "!"; or a half-size in engine units (body = 100) */
  framed?: 'tight' | 'full' | number;
  animated?: boolean;
}) {
  const reduce = useReducedMotion();
  const live = animated && !reduce;

  const ink = COLOR_BY_ID.get(color)?.hex ?? color;
  const radii = SHAPE_BY_ID.get(shape)?.radii ?? null;
  const expr = EXPRESSION_BY_ID.get(expression) ?? null;

  const uid = useMemo(() => `bloub${++seq}`, []);
  const engineRef = useRef<BotEngine | null>(null);
  if (!engineRef.current) engineRef.current = new BotEngine(R, state, radii, expr);
  const engine = engineRef.current;

  const clock = useRef(0);
  const [frame, setFrame] = useState<BotFrame>(() => engine.sample(0));

  // Same scene clock as the original: capped delta, so a hidden tab resumes
  // without jumping. Small icons redraw at ~30fps, which looks the same.
  useEffect(() => {
    if (!live) {
      // let a change settle, then draw it still
      setFrame(engine.sample(clock.current + 5));
      return;
    }
    let raf = 0;
    let last = 0;
    let drawn = 0;
    const minGap = size < 64 ? 1 / 30 : 0;
    const tick = (ms: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0;
      last = ms;
      clock.current += dt;
      if (clock.current - drawn < minGap) return;
      drawn = clock.current;
      setFrame(engine.sample(clock.current));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, engine, size]);

  // Prop changes morph instead of jumping (the engine dates them on its clock)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (engine.state !== state) engine.setState(state, clock.current);
    if (!live) setFrame(engine.sample(clock.current + 5));
  }, [state, engine, live]);
  useEffect(() => {
    engine.setExpression(expr, clock.current);
  }, [expr, engine]);
  useEffect(() => {
    engine.setShape(radii, clock.current);
  }, [radii, engine]);

  const half = framed === 'tight' ? TIGHT : framed === 'full' ? VB : framed;
  const maskId = `${uid}-mask`;
  const bg = paper ?? '#FFFFFF';

  const dot = (d: BotFrame['dots'][number], key: string) => {
    const fill = d.color ?? (d.depth === undefined ? ink : mixHex(bg, ink, d.depth));
    return d.d ? (
      <Path key={key} d={d.d} fill={fill} opacity={d.opacity} transform={`translate(${d.x} ${d.y}) rotate(${d.rot ?? 0}) scale(${R})`} />
    ) : (
      <Circle key={key} cx={d.x} cy={d.y} r={d.r} fill={fill} opacity={d.opacity} />
    );
  };

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}>
        <Defs>
          <Mask id={maskId} maskUnits="userSpaceOnUse" x={-VB} y={-VB} width={VB * 2} height={VB * 2}>
            <Path d={frame.bodyPath} fill="#fff" />
            {frame.eyes.map((eye, i) => (
              <Path key={i} d={eye.d} transform={eye.matrix} opacity={eye.alpha} fill="#000" />
            ))}
            {frame.notch ? <Circle cx={frame.notch.x} cy={frame.notch.y} r={frame.notch.r} fill="#000" /> : null}
          </Mask>
          {frame.arcs.map((arc) => (
            <LinearGradient key={arc.id} id={`${uid}-${arc.id}`} gradientUnits="userSpaceOnUse" x1={arc.grad.x1} y1={arc.grad.y1} x2={arc.grad.x2} y2={arc.grad.y2}>
              {arc.grad.stops.map((c, i) => (
                <Stop key={i} offset={i / (arc.grad.stops.length - 1)} stopColor={c} />
              ))}
            </LinearGradient>
          ))}
        </Defs>

        {/* back half of the rings: drawn before the body, so it hides them */}
        <G fill="none" strokeLinecap="round">
          {frame.arcs.map((arc) => (
            <Path key={`b${arc.id}`} d={arc.back} stroke={`url(#${uid}-${arc.id})`} strokeWidth={arc.width} opacity={arc.opacity} fill="none" />
          ))}
        </G>

        {frame.dotsBehind ? <G>{frame.dots.map((d, i) => dot(d, `pb${i}`))}</G> : null}

        <G opacity={frame.bodyAlpha}>
          {/* under the eye holes: keeps rings behind the body out of the eyes */}
          {paper || frame.arcs.length || frame.dotsBehind ? <Path d={frame.bodyPath} fill={bg} /> : null}
          <G mask={`url(#${maskId})`}>
            <Rect x={-VB} y={-VB} width={VB * 2} height={VB * 2} fill={ink} />
          </G>
        </G>

        {!frame.dotsBehind ? <G>{frame.dots.map((d, i) => dot(d, `pf${i}`))}</G> : null}

        {frame.notif ? <Circle cx={frame.notif.x} cy={frame.notif.y} r={frame.notif.r} fill={NOTIF_BLUE} /> : null}

        {/* front half of the rings */}
        <G fill="none" strokeLinecap="round">
          {frame.arcs.map((arc) => (
            <Path key={`f${arc.id}`} d={arc.front} stroke={`url(#${uid}-${arc.id})`} strokeWidth={arc.width} opacity={arc.opacity} fill="none" />
          ))}
        </G>
      </Svg>
    </View>
  );
}
