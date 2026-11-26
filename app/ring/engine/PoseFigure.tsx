// Creative Ring engine: the original two-sides challenge from iDontCry's Heisman
// (Nov 25 2026), carried over as-is so both sites run the same mechanics.
// Only change: storage keys start with "sitr-ring-" (core.ts).
"use client";

// The demonstration figure. `motion="loop"` animates stand → pose → hold →
// down; "hold" and "start" are still pictures. Reduced motion, no JS, and the
// first paint all show the held pose. The working arm and knee take the
// area's colour (challenge.css); the support side is drawn behind, quieter.

import { useEffect, useState } from "react";
import { FIGURE_VIEW, LOOP_HOLD_START, loopFrame, mixPose, skeleton } from "./figure";
import type { Side, TwoSidesChallenge, Version } from "./types";

export function PoseFigure({
  challenge,
  version,
  side,
  motion = "hold",
  label,
  size = 220,
}: {
  challenge: TwoSidesChallenge;
  version: Version;
  side: Side;
  motion?: "loop" | "hold" | "start";
  label: string;
  size?: number;
}) {
  const [frame, setFrame] = useState({ t: motion === "start" ? 0 : 1, sway: 0 });

  useEffect(() => {
    if (motion !== "loop") return;
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now() - LOOP_HOLD_START;
    const tick = (now: number) => {
      setFrame(loopFrame(now - t0));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [motion]);

  const poses = challenge.poses[version];
  const t = motion === "start" ? 0 : motion === "hold" ? 1 : frame.t;
  const angles = mixPose(poses.start, poses.hold, t);
  if (motion === "loop" && frame.sway) {
    angles.torso += frame.sway;
    angles.farShin -= frame.sway * 0.6;
  }
  const sk = skeleton(angles, version === "seated");
  const mirror = side === "left";

  return (
    <svg
      className="tsc-figure"
      viewBox={`${FIGURE_VIEW.x} ${FIGURE_VIEW.y} ${FIGURE_VIEW.w} ${FIGURE_VIEW.h}`}
      width={size}
      height={Math.round((size * FIGURE_VIEW.h) / FIGURE_VIEW.w)}
      role="img"
      aria-label={label}
      data-side={side}
      data-motion={motion}
    >
      <line className="tsc-ground" x1={40} y1={sk.ground + 4} x2={160} y2={sk.ground + 4} />
      <g transform={mirror ? "translate(200 0) scale(-1 1)" : undefined}>
        {sk.chair.map((s) => (
          <line key={s.id} className="tsc-chair" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
        ))}
        {sk.segs
          .filter((s) => s.role === "far")
          .map((s) => (
            <line key={s.id} className="tsc-far" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
        {sk.segs
          .filter((s) => s.role === "body")
          .map((s) => (
            <line key={s.id} className="tsc-body" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
        <circle className="tsc-head" cx={sk.head.x} cy={sk.head.y} r={sk.head.r} />
        <g transform={`rotate(${sk.ball.rot} ${sk.ball.x} ${sk.ball.y})`}>
          <ellipse className="tsc-ball" cx={sk.ball.x} cy={sk.ball.y} rx={10} ry={6.5} />
          <line className="tsc-lace" x1={sk.ball.x - 4} y1={sk.ball.y} x2={sk.ball.x + 4} y2={sk.ball.y} />
        </g>
        {sk.segs
          .filter((s) => s.role === "work")
          .map((s) => (
            <line key={s.id} className="tsc-work" data-seg={s.id} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
      </g>
    </svg>
  );
}
