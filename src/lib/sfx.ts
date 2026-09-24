"use client";

import { useSyncExternalStore } from "react";

// Interface sounds, synthesized with Web Audio so there are no files to ship.
// Kept soft on purpose: pure sine tones, a gentle attack, low volume, and
// everything goes through a low-pass filter so nothing sounds sharp.

export type Sfx = "click" | "open" | "close" | "forward" | "back" | "peel";

type Tone = { freq: number; to?: number; at?: number; dur: number; gain: number };
// `sweep`: a band of noise gliding up, like adhesive letting go.
type Sound = { tones: Tone[]; tick?: number; sweep?: { from: number; to: number; dur: number; gain: number } };

const SOUNDS: Record<Sfx, Sound> = {
  // A muted key press: a very short band of noise under a low thump.
  click: { tick: 0.05, tones: [{ freq: 240, to: 180, dur: 0.06, gain: 0.05 }] },
  // Two soft notes, a fourth apart, up to open and down to close.
  open: {
    tones: [
      { freq: 392, dur: 0.28, gain: 0.04 },
      { freq: 523.25, at: 0.07, dur: 0.36, gain: 0.035 },
    ],
  },
  close: {
    tones: [
      { freq: 523.25, dur: 0.22, gain: 0.03 },
      { freq: 392, at: 0.06, dur: 0.3, gain: 0.035 },
    ],
  },
  forward: { tick: 0.03, tones: [{ freq: 440, to: 494, dur: 0.12, gain: 0.03 }] },
  back: { tick: 0.03, tones: [{ freq: 494, to: 440, dur: 0.12, gain: 0.03 }] },
  peel: { tones: [], sweep: { from: 380, to: 2200, dur: 0.32, gain: 0.07 } },
};

const KEY = "saira:muted";
let ctx: AudioContext | null = null;
let out: AudioNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
const listeners = new Set<() => void>();

try {
  if (typeof window !== "undefined") muted = localStorage.getItem(KEY) === "1";
} catch {}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1400;
    lowpass.Q.value = 0.5;
    lowpass.connect(ctx.destination);
    out = lowpass;

    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function envelope(ac: AudioContext, start: number, peak: number, dur: number) {
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(peak, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  amp.connect(out!);
  return amp;
}

export function play(name: Sfx) {
  if (muted || typeof window === "undefined") return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const sound = SOUNDS[name];

  for (const t of sound.tones) {
    const start = now + (t.at ?? 0);
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.dur);
    osc.connect(envelope(ac, start, t.gain, t.dur));
    osc.start(start);
    osc.stop(start + t.dur + 0.05);
  }

  if (sound.sweep && noise) {
    const { from, to, dur, gain } = sound.sweep;
    const src = ac.createBufferSource();
    src.buffer = noise;
    const band = ac.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 2;
    band.frequency.setValueAtTime(from, now);
    band.frequency.exponentialRampToValueAtTime(to, now + dur);
    const amp = ac.createGain();
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + dur * 0.35);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(band).connect(amp).connect(out!);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  if (sound.tick && noise) {
    const src = ac.createBufferSource();
    src.buffer = noise;
    const band = ac.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 1.2;
    src.connect(band).connect(envelope(ac, now, sound.tick, 0.025));
    src.start(now);
  }
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

export function useMuted() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => muted,
    () => false,
  );
}
