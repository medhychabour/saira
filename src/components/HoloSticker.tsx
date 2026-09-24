"use client";

import { animate, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/content/products";
import { play } from "@/lib/sfx";
import { MARKS, type MarkShape } from "./Mark";
import styles from "./HoloSticker.module.css";

// A die-cut holographic sticker: silver rim, foil that shifts with the pointer,
// the mark printed in ink on top, and a corner that peels off when pressed.

const FALLBACK: MarkShape = { viewBox: "0 0 100 100", paths: [], cut: "<circle cx='50' cy='50' r='50'/>" };

function geometry(mark: MarkShape) {
  const [, , w, h] = mark.viewBox.split(" ").map(Number);
  const s = Math.max(w, h);
  const pad = s * 0.16;
  const viewBox = `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`;
  // The die-cut is the mark grown outward by `outset`, with its holes filled.
  const shape = (outset: number) => {
    const body = mark.paths.map((d) => `<path d='${d}'/>`).join("") + (mark.cut ?? "");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'><g fill='white' stroke='white' stroke-width='${2 * outset}' stroke-linejoin='round' stroke-linecap='round'>${body}</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  };
  return { viewBox, outer: shape(s * 0.13), foil: shape(s * 0.1) };
}

// How far in from the top-right corner the die-cut starts, as a share of the
// size, measured along the fold direction. The peel starts from there so the
// fold always bites into the sticker, whatever its shape.
function useCornerGap(maskUrl: string) {
  const [gap, setGap] = useState(0.3);
  useEffect(() => {
    const src = maskUrl.slice(5, -2);
    const img = new Image();
    img.onload = () => {
      const n = 200;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = n;
      const c = canvas.getContext("2d");
      if (!c) return;
      c.drawImage(img, 0, 0, n, n);
      const data = c.getImageData(0, 0, n, n).data;
      for (let i = 0; i < n; i++) {
        // Walk the diagonal from the top-right corner inward.
        const x = n - 1 - i;
        const y = i;
        if (data[(y * n + x) * 4 + 3] > 128) {
          setGap((i / n) * 2);
          return;
        }
      }
    };
    img.src = src;
  }, [maskUrl]);
  return gap;
}

const mask = (url: string) => ({ maskImage: url, WebkitMaskImage: url });

export function HoloSticker({ product, size, selected }: { product: Product; size: number; selected: boolean }) {
  const mark = MARKS[product.slug] ?? FALLBACK;
  const geo = useMemo(() => geometry(mark), [mark]);
  const gap = useCornerGap(geo.outer);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Tilt follows the pointer; the foil and the glare follow it too.
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const sx = useSpring(px, { stiffness: 120, damping: 20 });
  const sy = useSpring(py, { stiffness: 120, damping: 20 });

  // When nobody touches it, the foil drifts slowly so it always shimmers.
  useEffect(() => {
    if (hover) return;
    const a = animate(px, [30, 70, 30], { duration: 7, repeat: Infinity, ease: "easeInOut" });
    const b = animate(py, [65, 35, 65], { duration: 9, repeat: Infinity, ease: "easeInOut" });
    return () => {
      a.stop();
      b.stop();
    };
  }, [hover, px, py]);

  // Peel: how much of the sticker has come off at the top-right corner, as a
  // share of the size, on top of the empty gap before the die-cut starts.
  const peel = useSpring(0, { stiffness: 260, damping: 19 });
  const lift = pressed ? 0.2 : selected ? 0.12 : hover ? 0.05 : 0;
  const target = lift ? gap + lift : 0;
  useEffect(() => {
    peel.set(target);
  }, [peel, target]);

  const a = useTransform(peel, (v) => v * size);
  const bodyClip = useTransform(a, (v) => `polygon(0 0, ${size - v}px 0, ${size}px ${v}px, ${size}px ${size}px, 0 ${size}px)`);
  // The flap is the corner triangle mirrored across the fold line.
  const flapClip = useTransform(a, (v) => `polygon(${size - v}px 0, ${size}px 0, ${size}px ${v}px)`);
  const flapTransform = useTransform(a, (v) => `matrix(0, 1, 1, 0, ${size - v}, ${v - size})`);
  const flapShade = useTransform(a, (v) => {
    const p = (v / (2 * size)) * 100;
    return `linear-gradient(45deg, #5d636c ${100 - p}%, #c9cdd3 ${100 - p * 0.8}%, #ffffff ${100 - p * 0.4}%, #b9bec6 100%)`;
  });

  const transform = useMotionTemplate`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  const fx = useMotionTemplate`${sx}%`;
  const fy = useMotionTemplate`${sy}%`;

  function onMove(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    ry.set((x - 0.5) * 26);
    rx.set((0.5 - y) * 26);
    px.set(x * 100);
    py.set(y * 100);
  }

  function onLeave() {
    setHover(false);
    setPressed(false);
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={styles.sticker}
      style={{ width: size, height: size, transform, "--fx": fx, "--fy": fy } as never}
      onPointerEnter={() => setHover(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={() => {
        setPressed(true);
        play("peel");
      }}
      onPointerUp={() => setPressed(false)}
    >
      <motion.div className={styles.body} style={{ clipPath: bodyClip }}>
        <div className={`${styles.layer} ${styles.rim}`} style={mask(geo.outer)} />
        <div className={`${styles.layer} ${styles.foil}`} style={mask(geo.foil)} />
        <svg className={styles.layer} viewBox={geo.viewBox} aria-hidden>
          <defs>
            <linearGradient id={`ink-${product.slug}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d2230" />
              <stop offset="1" stopColor="#07080c" />
            </linearGradient>
          </defs>
          <g fill={`url(#ink-${product.slug})`} shapeRendering={product.slug === "warns" ? "crispEdges" : undefined}>
            {mark.paths.map((d) => (
              <path key={d.slice(0, 24)} d={d} />
            ))}
          </g>
          {mark === FALLBACK && (
            <text x="50" y="50" dy="0.35em" textAnchor="middle" fontSize="48" fontWeight="600" fill="#0b0d12">
              {product.name[0]}
            </text>
          )}
        </svg>
        <div className={`${styles.layer} ${styles.glare}`} style={mask(geo.outer)} />
      </motion.div>

      <div className={styles.flapShadow}>
        <motion.div
          className={`${styles.layer} ${styles.flap}`}
          style={{ ...mask(geo.outer), clipPath: flapClip, transform: flapTransform, backgroundImage: flapShade }}
        />
      </div>
    </motion.div>
  );
}
