"use client";

import { useEffect, useRef } from "react";
import type { MarkShape } from "./Mark";

// The mark decoded from falling code on an early-2000s CRT, blue by default.
//
// - On arrival the mark is empty. One wave of code falls down every column
//   and each cell of the mark locks into place as the wave passes through it.
// - Once decoded, the glyphs keep flickering and each frame leaves a short
//   phosphor trail; an additive bloom keeps the mark lit.
// - A single soft sheen travels across the logos one after the other, left to
//   right, then rests before the next pass.
// - Under the pointer, glyphs scramble, brighten and part.
// - An optional gesture keeps the shape gently alive (flap, spin, pulse, sway).

const GLYPHS = "0123456789$#JS75^:=+*<>ｱｲｳｴｵｶｷｸ";
// Default grid: rows and columns of glyphs.
const GRID = { rows: 28, cols: 46 };
const FPS = 30;

type Drop = { y: number; speed: number; len: number };

// A small living motion for the shape, as a transform around its centre at
// time t (seconds): wings that flap, a slow spin, a breath, a sway.
export type Gesture = "flap" | "spin" | "pulse" | "sway";

// Smooth wandering value in [-1, 1]: a few slow sines that never line up,
// so it drifts without repeating in any way the eye can catch.
const wander = (t: number, seed: number) =>
  (Math.sin(t * 0.61 + seed) + Math.sin(t * 0.23 + seed * 2.1) * 0.8 + Math.sin(t * 1.07 + seed * 0.7) * 0.5) / 2.3;

// Flight state for the flap: the wing phase is integrated frame by frame, so
// its speed can change smoothly without the wings ever jumping.
type Flight = { phase: number; last: number };

// A butterfly: bursts of quick beats and slow glides that blend into each
// other, beats that are sometimes wide and sometimes small, and a body that
// floats and tilts a little. Nothing stops dead.
function flap(state: Flight, t: number) {
  const dt = Math.min(0.1, Math.max(0, t - state.last));
  state.last = t;
  // Beat speed drifts between a lazy glide (~0.35 Hz) and a flutter (~2.2 Hz).
  const busy = Math.pow((wander(t * 0.5, 1.3) + 1) / 2, 1.6);
  state.phase += dt * Math.PI * 2 * (0.35 + 1.85 * busy);
  // Wide beats when fluttering hard, smaller ones when gliding.
  const amp = 0.14 + 0.3 * (0.35 * busy + 0.65 * ((wander(t * 0.8, 4.2) + 1) / 2));
  const fold = ((1 - Math.cos(state.phase)) / 2) * amp;
  return {
    sx: 1 - fold,
    sy: 1 + fold * 0.06,
    rot: wander(t * 0.7, 2.7) * 0.06,
    dy: wander(t * 0.9, 5.1) * 0.03 + fold * 0.04,
  };
}

function gestureAt(g: Gesture, t: number): { sx: number; sy: number; rot: number } {
  switch (g) {
    case "flap":
      return { sx: 1, sy: 1, rot: 0 }; // handled by `flap`, which keeps state
    case "spin":
      return { sx: 1, sy: 1, rot: (t / 24) * Math.PI * 2 };
    case "pulse": {
      const b = 0.5 - 0.5 * Math.cos((t / 3.2) * Math.PI * 2);
      return { sx: 1 - 0.06 * b, sy: 1 - 0.06 * b, rot: 0 };
    }
    case "sway":
      return { sx: 1, sy: 1, rot: Math.sin((t / 4.5) * Math.PI * 2) * 0.2 };
  }
}

const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

type RGB = [number, number, number];
type Palette = { stops: [number, RGB][]; bright: RGB; highlight: RGB };

// Two close tones alternating in soft diagonal bands, a brighter one under
// the pointer, and the highlight for wave heads, flashes and the sheen.
const PALETTES: Record<"blue" | "white", Palette> = {
  blue: {
    stops: [
      [0, [0x5a, 0xa8, 0xff]],
      [0.26, [0x7c, 0xc4, 0xff]],
      [0.51, [0x5a, 0xa8, 0xff]],
      [0.75, [0x7c, 0xc4, 0xff]],
      [1, [0x5a, 0xa8, 0xff]],
    ],
    bright: [190, 225, 255],
    highlight: [235, 245, 255],
  },
  white: {
    stops: [
      [0, [0xd8, 0xd8, 0xdc]],
      [0.26, [0xff, 0xff, 0xff]],
      [0.51, [0xd8, 0xd8, 0xdc]],
      [0.75, [0xff, 0xff, 0xff]],
      [1, [0xd8, 0xd8, 0xdc]],
    ],
    bright: [255, 255, 255],
    highlight: [255, 255, 255],
  },
};

function gradientAt(stops: [number, RGB][], t: number): RGB {
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    const [t0, c0] = stops[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return c0.map((v, j) => v + (c1[j] - v) * k) as RGB;
    }
  }
  return stops[stops.length - 1][1];
}

const mix = (a: RGB, b: RGB, k: number) => a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(",");

// Each cell takes its colour from a diagonal pass through the gradient.
const tintFor = (stops: [number, RGB][], rows: number, cols: number) =>
  Array.from({ length: rows * cols }, (_, i) =>
    gradientAt(stops, Math.min(1, ((i % cols) / cols) * 0.75 + (Math.floor(i / cols) / rows) * 0.25)),
  );

// The sheen crosses one logo in SWEEP seconds, logos in turn, then rests so
// a full cycle lasts PERIOD seconds.
const SWEEP = 1.8;
const PERIOD = 8;
const WIDTH = 0.3; // half-width of the sheen along the diagonal

export function MatrixLogo({
  mark,
  size,
  index = 0,
  tone = "blue",
  grid = GRID,
  gesture,
}: {
  mark: MarkShape;
  size: number;
  index?: number;
  tone?: keyof typeof PALETTES;
  grid?: { rows: number; cols: number };
  gesture?: Gesture;
}) {
  const { rows: ROWS, cols: COLS } = grid;
  const { stops, bright: BRIGHT, highlight: HIGHLIGHT } = PALETTES[tone];
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    el.width = size * dpr;
    el.height = size * dpr;

    // Coverage of the mark in each cell, sampled from a finer render.
    const N = 230;
    const probe = document.createElement("canvas");
    probe.width = probe.height = N;
    const pc = probe.getContext("2d", { willReadFrequently: true })!;
    const [, , w, h] = mark.viewBox.split(" ").map(Number);
    const k = (N * 0.78) / Math.max(w, h);
    const paths = mark.paths.map((d) => new Path2D(d));
    const TINT = tintFor(stops, ROWS, COLS);
    const cover = new Float32Array(ROWS * COLS);
    const flight: Flight = { phase: 0, last: 0 };
    const sample = (t: number) => {
      pc.setTransform(1, 0, 0, 1, 0, 0);
      pc.clearRect(0, 0, N, N);
      // Centre of the canvas, then the gesture, then the mark centred on it.
      pc.translate(N / 2, N / 2);
      if (gesture === "flap") {
        const g = flap(flight, t);
        pc.translate(0, g.dy * N);
        pc.rotate(g.rot);
        pc.scale(g.sx, g.sy);
      } else if (gesture) {
        const g = gestureAt(gesture, t);
        pc.rotate(g.rot);
        pc.scale(g.sx, g.sy);
      }
      pc.scale(k, k);
      pc.translate(-w / 2, -h / 2);
      pc.fillStyle = "#fff";
      for (const p of paths) pc.fill(p);
      const px = pc.getImageData(0, 0, N, N).data;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x0 = Math.floor((c / COLS) * N);
          const x1 = Math.floor(((c + 1) / COLS) * N);
          const y0 = Math.floor((r / ROWS) * N);
          const y1 = Math.floor(((r + 1) / ROWS) * N);
          let sum = 0;
          let count = 0;
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++, count++) sum += px[(y * N + x) * 4 + 3];
          cover[r * COLS + c] = sum / (count * 255);
        }
      }
    };
    const born = performance.now();
    sample(0);

    // Round vignette for the ambient rain, so the square canvas never shows.
    const vignette = new Float32Array(ROWS * COLS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dx = (c + 0.5) / COLS - 0.5;
        const dy = (r + 0.5) / ROWS - 0.5;
        const d = Math.sqrt(dx * dx + dy * dy) / 0.5;
        vignette[r * COLS + c] = Math.max(0, 1 - d) ** 1.1;
      }
    }

    const glyph = Array.from(cover, pick);
    const locked = new Uint8Array(ROWS * COLS);
    const flash = new Float32Array(ROWS * COLS);

    // One falling drop per column, played once when the logo appears.
    const drops: Drop[] = [];
    for (let c = 0; c < COLS; c++) drops[c] = { y: -Math.random() * 14, speed: 0.7 + Math.random() * 0.9, len: 6 + Math.random() * 12 };

    // Pointer position, in cells.
    let pointer: { c: number; r: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      pointer = { c: ((e.clientX - b.left) / b.width) * COLS, r: ((e.clientY - b.top) / b.height) * ROWS };
    };
    const onLeave = () => (pointer = null);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    // Glyphs are drawn here with a fading trail, then composited with bloom.
    const layer = document.createElement("canvas");
    layer.width = el.width;
    layer.height = el.height;
    const lc = layer.getContext("2d")!;
    const cw = el.width / COLS;
    const ch = el.height / ROWS;
    lc.font = `700 ${ch * 0.92}px Inter, system-ui, sans-serif`;
    lc.textAlign = "center";
    lc.textBaseline = "middle";

    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 1000 / FPS) return;
      last = now;
      // Where the sheen is on this logo: from before its left edge to past its right.
      const tt = ((now / 1000) % PERIOD) - index * SWEEP;
      const shine = tt >= 0 && tt < SWEEP ? -WIDTH + (tt / SWEEP) * (1.25 + 2 * WIDTH) : -10;

      // Fade the previous frame instead of clearing it: phosphor persistence.
      lc.globalCompositeOperation = "destination-out";
      lc.fillStyle = "rgba(0,0,0,0.64)";
      lc.fillRect(0, 0, layer.width, layer.height);
      lc.globalCompositeOperation = "source-over";

      for (const d of drops) if (d.y - d.len <= ROWS) d.y += d.speed;
      if (gesture) sample((now - born) / 1000);
      const decoded = drops.every((d) => d.y - d.len > ROWS);

      for (let r = 0; r < ROWS; r++) {
        const y = (r + 0.5) * ch;

        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const v = cover[i];
          // A moving shape gets soft edges: partly covered cells show faintly.
          const inside = v >= (gesture ? 0.06 : 0.3);
          const edge = gesture ? Math.min(1, v / 0.6) : 1;

          // The wave over this cell: 1 at the head, fading up the tail.
          const t = drops[c].y - r;
          const rain = t >= 0 && t < drops[c].len ? 1 - t / drops[c].len : 0;
          const head = t >= 0 && t < 1;

          if (inside && head) {
            if (!locked[i]) flash[i] = 1;
            locked[i] = 1;
            flash[i] = Math.max(flash[i], 0.7);
          }

          let x = (c + 0.5) * cw;
          let yy = y;
          let lift = 0;
          if (pointer) {
            const dx = c + 0.5 - pointer.c;
            const dy = (r + 0.5 - pointer.r) * (COLS / ROWS) * 0.6;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const R = 7;
            if (dist < R) {
              const f = 1 - dist / R;
              lift = f;
              x += (dx / (dist || 1)) * f * cw * 1.6;
              yy += (dy / (dist || 1)) * f * ch * 0.5;
              if (Math.random() < 0.5 * f) glyph[i] = pick();
            }
          }

          // The sheen: a wide, soft cosine falloff around its line.
          const d = Math.abs((c / COLS) * 0.8 + (r / ROWS) * 0.45 - shine);
          const sheen = d < WIDTH ? 0.5 + 0.5 * Math.cos((Math.PI * d) / WIDTH) : 0;

          let a: number;
          let color: string;
          if (inside && (locked[i] || decoded)) {
            if (Math.random() < 0.05) glyph[i] = pick();
            a = (0.72 + v * 0.28) * (0.88 + Math.random() * 0.12) + rain * 0.25 + lift * 0.4 + sheen * 0.35;
            const f = flash[i];
            flash[i] *= 0.82;
            color = f > 0.35 || head ? HIGHLIGHT.join(",") : lift > 0.5 ? BRIGHT.join(",") : mix(TINT[i], HIGHLIGHT, sheen * 0.7);
            a = Math.min(1, a + f * 0.4) * edge;
          } else {
            // The wave: full inside the mark, faint around it.
            const strength = inside ? 0.9 : 0.5 * vignette[i];
            a = rain * strength;
            if (a < 0.03) continue;
            if (head || Math.random() < 0.15) glyph[i] = pick();
            color = head ? HIGHLIGHT.join(",") : TINT[i].join(",");
          }

          lc.fillStyle = `rgba(${color},${a})`;
          lc.fillText(glyph[i], x, yy);
        }
      }

      ctx.clearRect(0, 0, el.width, el.height);
      ctx.globalAlpha = 0.93 + Math.random() * 0.07; // faint CRT flicker
      // Everything adds up as light: a wide bloom, a tighter glow, a smear to
      // the right, then the crisp glyphs.
      const flicker = ctx.globalAlpha;
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = `blur(${ch * 1.3}px)`;
      ctx.globalAlpha = 0.75 * flicker;
      ctx.drawImage(layer, 0, 0);
      ctx.filter = `blur(${ch * 0.35}px)`;
      ctx.globalAlpha = 0.55 * flicker;
      ctx.drawImage(layer, 0, 0);
      ctx.filter = `blur(${ch * 0.15}px)`;
      for (let t = 1; t <= 3; t++) {
        ctx.globalAlpha = (0.14 / t) * flicker;
        ctx.drawImage(layer, t * cw * 0.9, 0);
      }
      ctx.filter = "none";
      ctx.globalAlpha = flicker;
      ctx.drawImage(layer, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      ctx.globalAlpha = 1;

      // Scanlines.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < el.height; y += 3 * dpr) ctx.fillRect(0, y, el.width, dpr);
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mark, size, ROWS, COLS, tone, gesture]);

  return <canvas ref={canvas} style={{ width: size, height: size, display: "block" }} />;
}
