export type AudioChannel = "master" | "music" | "ambience" | "effects";
export type AudioSettings = Record<AudioChannel, number> & { muted: boolean };
export type AudioCue =
  | "dice"
  | "pawn_move"
  | "buy"
  | "sell"
  | "money_gain"
  | "loss"
  | "context"
  | "event"
  | "bull"
  | "bear"
  | "crash"
  | "travel"
  | "prison"
  | "victory"
  | "ui_click"
  | "UIclick"
  // Existing callers remain supported.
  | "roll"
  | "trade"
  | "step"
  | "confirm"
  | "market-up"
  | "market-down";

const STORAGE_KEY = "global-fund-audio-settings";
const defaults: AudioSettings = {
  master: 0.72,
  music: 0.32,
  ambience: 0.24,
  effects: 0.62,
  muted: true,
};

let settings = readSettings();
let unlocked = false;
const activeAudio = new Map<HTMLAudioElement, number>();
const lastPlayed = new Map<string, number>();
const MAX_CONCURRENT_SOUNDS = 8;

function readSettings(): AudioSettings {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    const saved = JSON.parse(raw ?? "null") as Partial<AudioSettings> | null;
    return {
      master: clamp(saved?.master ?? defaults.master),
      music: clamp(saved?.music ?? defaults.music),
      ambience: clamp(saved?.ambience ?? defaults.ambience),
      effects: clamp(saved?.effects ?? defaults.effects),
      muted:
        typeof saved?.muted === "boolean" ? saved.muted : defaults.muted,
    };
  } catch {
    return { ...defaults };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Storage can be unavailable in private or embedded contexts. */
  }
}

export function getAudioSettings(): AudioSettings {
  return { ...settings };
}

export function setAudioSettings(next: Partial<AudioSettings>): AudioSettings {
  settings = {
    master: clamp(next.master, settings.master),
    music: clamp(next.music, settings.music),
    ambience: clamp(next.ambience, settings.ambience),
    effects: clamp(next.effects, settings.effects),
    muted:
      typeof next.muted === "boolean" ? next.muted : settings.muted,
  };
  persist();
  syncActiveAudio();
  return getAudioSettings();
}

function clamp(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback;
}

/** Call directly from a user gesture. Cues remain silent until this is called. */
export async function unlockAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  // HTMLAudioElement does not need an AudioContext, but this gesture boundary
  // preserves the existing API contract and avoids creating media on load.
  unlocked = true;
}

function volume(channel: AudioChannel) {
  return settings.muted ? 0 : settings.master * settings[channel];
}

function syncActiveAudio() {
  for (const [audio, gain] of activeAudio) {
    audio.volume = Math.min(1, volume("effects") * gain);
    if (settings.muted || volume("effects") <= 0) {
      audio.pause();
      activeAudio.delete(audio);
    }
  }
}

const files: Record<Exclude<AudioCue, "UIclick">, string[]> = {
  dice: ["dieThrow1.ogg", "dieThrow2.ogg", "dieShuffle1.ogg"],
  pawn_move: ["drop_001.ogg", "cardSlide1.ogg"],
  buy: ["cardPlace1.ogg", "cardPlace2.ogg"],
  sell: ["chipsCollide1.ogg", "chipsCollide2.ogg", "chipsCollide3.ogg"],
  money_gain: ["chipsCollide1.ogg", "chipsCollide2.ogg", "chipsCollide3.ogg"],
  loss: ["error_001.ogg"],
  context: ["open_001.ogg"],
  event: ["confirmation_001.ogg", "confirmation_002.ogg"],
  bull: ["confirmation_001.ogg", "chipsCollide2.ogg"],
  bear: ["error_001.ogg"],
  crash: ["glass_001.ogg", "glitch_001.ogg"],
  travel: ["cardSlide1.ogg", "drop_001.ogg"],
  prison: ["error_001.ogg"],
  victory: ["confirmation_001.ogg", "confirmation_002.ogg"],
  ui_click: ["click_001.ogg", "click_002.ogg", "select_001.ogg", "select_002.ogg"],
  roll: ["dieThrow1.ogg", "dieThrow2.ogg", "dieShuffle1.ogg"],
  trade: ["chipsCollide1.ogg", "chipsCollide2.ogg", "chipsCollide3.ogg"],
  step: ["drop_001.ogg", "cardSlide1.ogg"],
  confirm: ["confirmation_001.ogg", "confirmation_002.ogg"],
  "market-up": ["chipsCollide1.ogg", "chipsCollide2.ogg"],
  "market-down": ["error_001.ogg"],
};

function normalizedCue(name: AudioCue): Exclude<AudioCue, "UIclick"> {
  return name === "UIclick" ? "ui_click" : name;
}

function chooseFile(name: AudioCue): string {
  const candidates = files[normalizedCue(name)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const cueGains: Partial<Record<AudioCue, number>> = {
  dice: 0.75,
  roll: 0.75,
  pawn_move: 0.48,
  step: 0.48,
  ui_click: 0.35,
  UIclick: 0.35,
  crash: 0.7,
};

/** Plays a local CC0 cue after an explicit user gesture has unlocked audio. */
export function playCue(name: AudioCue): void {
  if (!unlocked || settings.muted || volume("effects") <= 0) return;
  if (typeof Audio === "undefined") return;

  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  const minGap = name === "ui_click" || name === "UIclick" ? 90 : 45;
  if (now - (lastPlayed.get(name) ?? -Infinity) < minGap) return;
  lastPlayed.set(name, now);

  while (activeAudio.size >= MAX_CONCURRENT_SOUNDS) {
    const oldest = activeAudio.keys().next().value as HTMLAudioElement | undefined;
    if (!oldest) break;
    oldest.pause();
    activeAudio.delete(oldest);
  }

  try {
    const audio = new Audio(`/assets/audio/${chooseFile(name)}`);
    const gain = cueGains[name] ?? cueGains[normalizedCue(name)] ?? 0.62;
    audio.volume = Math.min(1, volume("effects") * gain);
    activeAudio.set(audio, gain);
    audio.addEventListener("ended", () => activeAudio.delete(audio), { once: true });
    audio.addEventListener("error", () => activeAudio.delete(audio), { once: true });
    void audio.play().catch(() => activeAudio.delete(audio));
  } catch {
    /* Unsupported audio leaves the rest of the game available. */
  }
}
