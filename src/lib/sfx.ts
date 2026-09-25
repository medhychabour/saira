"use client";

import { useSyncExternalStore } from "react";

// Interface sounds, synthesized with Web Audio so there are no files to ship.
//
// Short, dry blips in the spirit of Avara's interface sounds (measured, not
// copied): mid-register, 45 ms, no long or sliding notes, which read as
// whistling. Every sound is built from the same blip, the one used for "back",
// so they all feel like one family. Each blip is a sine with a quiet triangle
// for grain and a hair of random detune, then a gentle low-pass, a trace of
// room and a compressor.

export type Sfx = "open" | "close" | "forward" | "back";

// A tone: pitch and level each follow their own points, [seconds, value].
type Tone = {
  at?: number;
  pitch: [number, number][];
  level: [number, number][];
  grain?: number; // triangle layer, 0 to 1
};
type Air = { at?: number; freq: number; dur: number; gain: number };
type Sound = { tones: Tone[]; air?: Air[]; wet?: number };

// The blip: 45 ms by default, easing down a few percent as it fades.
const blip = (freq: number, gain: number, at = 0, dur = 0.045): Tone => ({
  at,
  pitch: [
    [0, freq],
    [dur, freq * 0.956],
  ],
  level: [
    [0, 0],
    [0.004, gain],
    [dur, 0.0001],
  ],
  grain: 0.15,
});

const SOUNDS: Record<Sfx, Sound> = {
  // Back is the reference blip; forward is the same, a fifth higher.
  back: { tones: [blip(523, 0.09)], wet: 0.03 },
  forward: { tones: [blip(784, 0.08)], wet: 0.03 },
  // Opening: two blips going up, with room between them and a longer second
  // note. Closing: the same two, going down.
  open: { tones: [blip(523, 0.085), blip(784, 0.08, 0.08, 0.055)], wet: 0.04 },
  close: { tones: [blip(784, 0.075), blip(523, 0.09, 0.05)], wet: 0.04 },
};

const KEY = "saira:muted";
let ctx: AudioContext | null = null;
let dry: AudioNode | null = null;
let room: AudioNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
// Phone speakers barely reproduce short blips in this register: on touch
// screens the sounds play louder, with more grain (upper harmonics) to carry.
let phone = false;
const listeners = new Set<() => void>();

try {
  if (typeof window !== "undefined") muted = localStorage.getItem(KEY) === "1";
} catch {}

// Wake the audio on the first touch anywhere, ahead of the first sound: iOS
// only allows it during a user gesture.
if (typeof window !== "undefined") {
  const wake = () => {
    if (!muted) audio();
  };
  window.addEventListener("pointerdown", wake, { once: true, capture: true });
  window.addEventListener("touchend", wake, { once: true, capture: true });
}

// A small, dry room: short decaying noise.
function impulse(ac: AudioContext) {
  const length = Math.floor(ac.sampleRate * 0.35);
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
  }
  return buffer;
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    // Mix with whatever the phone is playing and follow the silent switch:
    // interface sounds never cut someone's music.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "ambient";
    ctx = new AC();
    phone = window.matchMedia("(pointer: coarse)").matches;
    // iOS only unlocks audio once something has played inside a tap: a single
    // silent sample does it, so the first real sound is not lost.
    const unlock = ctx.createBufferSource();
    unlock.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    unlock.connect(ctx.destination);
    unlock.start();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.15;
    comp.connect(ctx.destination);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3800;
    lowpass.Q.value = 0.4;
    lowpass.connect(comp);
    dry = lowpass;

    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx);
    reverb.connect(lowpass);
    room = reverb;

    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  // Suspended until a first tap, or "interrupted" on iOS after a call or a
  // trip to the background: wake it on every play.
  if (ctx.state !== "running") void ctx.resume();
  return ctx;
}

// Sends a source to the dry path and, a little, to the room.
function route(ac: AudioContext, node: AudioNode, wet: number) {
  node.connect(dry!);
  if (wet > 0) {
    const send = ac.createGain();
    send.gain.value = wet;
    node.connect(send).connect(room!);
  }
}

// Follows [time, value] points from `start`, gliding exponentially between them.
function follow(param: AudioParam, points: [number, number][], start: number, scale = 1) {
  const [[t0, v0], ...rest] = points;
  param.setValueAtTime(Math.max(v0 * scale, 0.0001), start + t0);
  for (const [t, v] of rest) param.exponentialRampToValueAtTime(Math.max(v * scale, 0.0001), start + t);
}

function tone(ac: AudioContext, t: Tone, start: number, wet: number) {
  const end = t.level[t.level.length - 1][0];
  const amp = ac.createGain();
  follow(amp.gain, t.level, start, phone ? 2.5 : 1);
  route(ac, amp, wet);

  // A hair of random detune per play, so it never sounds machine-identical.
  const detune = 1 + (Math.random() * 2 - 1) * 0.015;
  const grain = phone ? Math.max(t.grain ?? 0, 0.5) : (t.grain ?? 0);
  const layers: [OscillatorType, number][] = [
    ["sine", 1 - grain * 0.5],
    ["triangle", grain],
  ];
  for (const [type, level] of layers) {
    if (level <= 0) continue;
    const o = ac.createOscillator();
    o.type = type;
    follow(o.frequency, t.pitch, start, detune);
    const g = ac.createGain();
    g.gain.value = level;
    o.connect(g).connect(amp);
    o.start(start);
    o.stop(start + end + 0.02);
  }
}

function air(ac: AudioContext, a: Air, start: number) {
  if (!noise) return;
  const src = ac.createBufferSource();
  src.buffer = noise;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = a.freq;
  band.Q.value = 0.7;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(a.gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + a.dur);
  src.connect(band).connect(amp);
  route(ac, amp, 0);
  src.start(start);
  src.stop(start + a.dur + 0.02);
}

export function play(name: Sfx) {
  if (muted || typeof window === "undefined") return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.005;
  const sound = SOUNDS[name];
  for (const t of sound.tones) tone(ac, t, now + (t.at ?? 0), sound.wet ?? 0);
  for (const a of sound.air ?? []) air(ac, a, now + (a.at ?? 0));
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
