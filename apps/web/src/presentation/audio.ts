export type AudioChannel = "master" | "music" | "effects" | "ambience";
export type AudioSettings = Record<AudioChannel, number> & { muted: boolean };
export type AudioCue =
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
  effects: 0.62,
  ambience: 0.24,
  muted: true,
};
let settings = readSettings();
let unlocked = false;
let context: AudioContext | null = null;
let chipAudio: HTMLAudioElement | null = null;

function readSettings(): AudioSettings {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    const saved = JSON.parse(raw ?? "null") as Partial<AudioSettings> | null;
    return { ...defaults, ...saved, muted: saved?.muted ?? defaults.muted };
  } catch {
    return { ...defaults };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage may be unavailable */
  }
}

export function getAudioSettings(): AudioSettings {
  return { ...settings };
}

export function setAudioSettings(next: Partial<AudioSettings>): AudioSettings {
  settings = {
    master: clamp(next.master ?? settings.master),
    music: clamp(next.music ?? settings.music),
    effects: clamp(next.effects ?? settings.effects),
    ambience: clamp(next.ambience ?? settings.ambience),
    muted: next.muted ?? settings.muted,
  };
  persist();
  return getAudioSettings();
}

const clamp = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

/** Call directly from a user gesture (settings toggle, roll, trade, etc.). */
export async function unlockAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    unlocked = true;
    return;
  }
  try {
    context ??= new AudioContextConstructor();
    if (context.state === "suspended") await context.resume();
    unlocked = true;
  } catch {
    unlocked = false;
  }
}

function volume(channel: AudioChannel) {
  return settings.muted ? 0 : settings.master * settings[channel];
}

function synth(
  frequencies: number[],
  duration: number,
  shape: OscillatorType,
  channel: AudioChannel,
  delay = 0,
) {
  if (!context || volume(channel) <= 0) return;
  const start = context.currentTime + delay;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, volume(channel) * 0.11),
    start + 0.018,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(context.destination);
  frequencies.forEach((frequency, index) => {
    const oscillator = context!.createOscillator();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (index) oscillator.detune.value = index % 2 ? -7 : 6;
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  });
}

const cues: Record<AudioCue, () => void> = {
  roll: () => {
    synth([493.88, 659.25], 0.19, "sine", "effects");
  },
  trade: () => {
    synth([659.25, 830.61], 0.22, "triangle", "effects");
  },
  step: () => {
    synth([392], 0.13, "sine", "effects");
  },
  confirm: () => {
    synth([523.25], 0.12, "sine", "effects");
    synth([783.99], 0.2, "sine", "effects", 0.085);
  },
  "market-up": () => {
    synth([392, 493.88], 0.23, "triangle", "effects");
    synth([587.33], 0.27, "sine", "effects", 0.12);
  },
  "market-down": () => {
    synth([392, 311.13], 0.24, "triangle", "effects");
    synth([233.08], 0.3, "sine", "effects", 0.12);
  },
};

/** Short generated cues avoid external sound licenses; chip clicks use the local CC0 recording. */
export function playCue(name: AudioCue): void {
  if (!unlocked || settings.muted || volume("effects") <= 0) return;
  if (name === "roll" || name === "trade" || name === "step") {
    if (typeof Audio !== "undefined") {
      try {
        chipAudio ??= new Audio("/assets/audio/chips-collide.ogg");
        const click = chipAudio.cloneNode(true) as HTMLAudioElement;
        click.volume = Math.min(1, volume("effects") * 0.42);
        void click.play().catch(() => {});
      } catch {
        /* generated cue remains available */
      }
    }
  }
  cues[name]();
}
