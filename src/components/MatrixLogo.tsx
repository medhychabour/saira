"use client";

import { useEffect, useRef } from "react";
import type { MarkShape } from "./Mark";

// The mark decoded from falling blue code on an early-2000s CRT.
//
// - On arrival the mark is empty. One wave of code falls down every column
//   and each cell of the mark locks into place as the wave passes through it.
// - Once decoded, the glyphs keep flickering and each frame leaves a short
//   phosphor trail; an additive bloom keeps the mark lit.
// - A single soft sheen travels across the logos one after the other, left to
//   right, then rests before the next pass.
// - Under the pointer, glyphs scramble, brighten and part.

const GLYPHS = "0123456789$#JS75^:=+*<>ｱｲｳｴｵｶｷｸ";
const ROWS = 28;
const COLS = 46;
const FPS = 30;

type Drop = { y: number; speed: number; len: number };

const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

// Two close blues alternating in soft diagonal bands.
type RGB = [number, number, number];
const STOPS: [number, RGB][] = [
  [0, [0x5a, 0xa8, 0xff]],
  [0.26, [0x7c, 0xc4, 0xff]],
  [0.51, [0x5a, 0xa8, 0xff]],
  [0.75, [0x7c, 0xc4, 0xff]],
  [1, [0x5a, 0xa8, 0xff]],
];
const BRIGHT: RGB = [190, 225, 255]; // under the pointer
const HIGHLIGHT: RGB = [235, 245, 255]; // wave heads, flashes, the sheen

function gradientAt(t: number): RGB {
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    const [t0, c0] = STOPS[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return c0.map((v, j) => v + (c1[j] - v) * k) as RGB;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

const mix = (a: RGB, b: RGB, k: number) => a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(",");

// Each cell takes its colour from a diagonal pass through the gradient.
const TINT = Array.from({ length: ROWS * COLS }, (_, i) =>
  gradientAt(Math.min(1, ((i % COLS) / COLS) * 0.75 + (Math.floor(i / COLS) / ROWS) * 0.25)),
);

// The sheen crosses one logo in SWEEP seconds, logos in turn, then rests so
// a full cycle lasts PERIOD seconds.
const SWEEP = 1.8;
const PERIOD = 8;
const WIDTH = 0.3; // half-width of the sheen along the diagonal

export function MatrixLogo({ mark, size, index = 0 }: { mark: MarkShape; size: number; index?: number }) {
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
    pc.setTransform(k, 0, 0, k, (N - w * k) / 2, (N - h * k) / 2);
    pc.fillStyle = "#fff";
    for (const d of mark.paths) pc.fill(new Path2D(d));
    const px = pc.getImageData(0, 0, N, N).data;
    const cover = new Float32Array(ROWS * COLS);
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

      for (let r = 0; r < ROWS; r++) {
        const y = (r + 0.5) * ch;

        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const v = cover[i];
          const inside = v >= 0.3;

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
          if (inside && locked[i]) {
            if (Math.random() < 0.05) glyph[i] = pick();
            a = (0.72 + v * 0.28) * (0.88 + Math.random() * 0.12) + rain * 0.25 + lift * 0.4 + sheen * 0.35;
            const f = flash[i];
            flash[i] *= 0.82;
            color = f > 0.35 || head ? HIGHLIGHT.join(",") : lift > 0.5 ? BRIGHT.join(",") : mix(TINT[i], HIGHLIGHT, sheen * 0.7);
            a = Math.min(1, a + f * 0.4);
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
  }, [mark, size]);

  return <canvas ref={canvas} style={{ width: size, height: size, display: "block" }} />;
}
