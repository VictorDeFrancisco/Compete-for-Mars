const MUTE_STORAGE_KEY = 'mars_music_muted';

let sharedAudioContext: AudioContext | null = null;
let sharedMasterGain: GainNode | null = null;

function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function getAudioOutput(): { ctx: AudioContext; destination: AudioNode } | null {
  if (typeof window === 'undefined' || isAudioMuted()) return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
    const compressor = sharedAudioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6, sharedAudioContext.currentTime);
    compressor.knee.setValueAtTime(10, sharedAudioContext.currentTime);
    compressor.ratio.setValueAtTime(4, sharedAudioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, sharedAudioContext.currentTime);
    compressor.release.setValueAtTime(0.1, sharedAudioContext.currentTime);

    const masterGain = sharedAudioContext.createGain();
    masterGain.gain.setValueAtTime(0.45, sharedAudioContext.currentTime);
    masterGain.connect(compressor);
    compressor.connect(sharedAudioContext.destination);
    sharedMasterGain = masterGain;
  }
  if (sharedAudioContext.state === 'suspended') {
    void sharedAudioContext.resume().catch(() => {});
  }
  return {
    ctx: sharedAudioContext,
    destination: sharedMasterGain ?? sharedAudioContext.destination,
  };
}

function playTone(
  frequency: number,
  durationSec: number,
  options: {
    type?: OscillatorType;
    gain?: number;
    endFrequency?: number;
    delaySec?: number;
    sustainRatio?: number;
    filterHz?: number;
  } = {}
): void {
  const output = getAudioOutput();
  if (!output) return;
  const { ctx, destination } = output;

  const {
    type = 'triangle',
    gain = 0.42,
    endFrequency,
    delaySec = 0,
    sustainRatio = 0.5,
    filterHz,
  } = options;

  try {
    const startAt = ctx.currentTime + delaySec;
    const stopAt = startAt + durationSec;
    const attackEnd = startAt + Math.min(0.01, durationSec * 0.2);
    const holdEnd = Math.max(attackEnd, startAt + durationSec * sustainRatio);
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    if (endFrequency !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), stopAt);
    }

    amp.gain.setValueAtTime(0.0001, startAt);
    amp.gain.linearRampToValueAtTime(gain, attackEnd);
    amp.gain.linearRampToValueAtTime(gain * 0.85, holdEnd);
    amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    if (filterHz) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterHz, startAt);
      osc.connect(filter);
      filter.connect(amp);
    } else {
      osc.connect(amp);
    }
    amp.connect(destination);
    osc.start(startAt);
    osc.stop(stopAt + 0.02);
  } catch {
    // Ignore audio errors when context is blocked or unavailable.
  }
}

export function playCountdownTick(finalGo = false): void {
  if (finalGo) {
    playTone(587.33, 0.12, { type: 'triangle', gain: 0.28, sustainRatio: 0.55 });
    playTone(880, 0.24, { type: 'triangle', gain: 0.32, delaySec: 0.065, sustainRatio: 0.55 });
    playTone(1174.66, 0.22, { type: 'sine', gain: 0.18, delaySec: 0.065, sustainRatio: 0.5 });
    return;
  }
  playTone(440, 0.14, { type: 'triangle', gain: 0.28, endFrequency: 420, sustainRatio: 0.5 });
  playTone(880, 0.1, { type: 'sine', gain: 0.12, sustainRatio: 0.4 });
}

let sharedNoiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  const length = Math.max(1, Math.floor(ctx.sampleRate * 0.05));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

function playNoiseTick(
  centerHz: number,
  q: number,
  durationSec: number,
  gain: number,
  delaySec = 0,
): void {
  const output = getAudioOutput();
  if (!output) return;
  const { ctx, destination } = output;

  try {
    const startAt = ctx.currentTime + delaySec;
    const stopAt = startAt + durationSec;
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerHz, startAt);
    filter.Q.setValueAtTime(q, startAt);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, startAt);
    amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    src.connect(filter);
    filter.connect(amp);
    amp.connect(destination);
    src.start(startAt);
    src.stop(stopAt + 0.005);
  } catch {
    // Ignore audio errors when context is blocked or unavailable.
  }
}

export function playSfxAction(): void {
  playTone(230, 0.042, { type: 'sine', gain: 0.24, endFrequency: 95, sustainRatio: 0.2 });
  playNoiseTick(1750, 1.8, 0.016, 0.16);
}

export function playSfxSuccess(): void {
  playTone(523.25, 0.09, { type: 'triangle', gain: 0.24, sustainRatio: 0.5 });
  playTone(659.25, 0.15, { type: 'triangle', gain: 0.28, delaySec: 0.055, sustainRatio: 0.5 });
}

export function playSfxPerfect(): void {
  playTone(587.33, 0.08, { type: 'triangle', gain: 0.24, sustainRatio: 0.5 });
  playTone(783.99, 0.09, { type: 'triangle', gain: 0.26, delaySec: 0.05, sustainRatio: 0.5 });
  playTone(1046.5, 0.18, { type: 'triangle', gain: 0.28, delaySec: 0.1, sustainRatio: 0.5 });
}

export function playSfxError(): void {
  playTone(220, 0.12, { type: 'sawtooth', gain: 0.18, endFrequency: 165, filterHz: 1400, sustainRatio: 0.5 });
  playTone(165, 0.16, { type: 'triangle', gain: 0.22, endFrequency: 115, delaySec: 0.075, sustainRatio: 0.5 });
}

export function playSfxDeflect(critical = false): void {
  if (critical) {
    playTone(740, 0.08, { type: 'triangle', gain: 0.22, endFrequency: 1200, sustainRatio: 0.4 });
    playTone(1318.5, 0.15, { type: 'sine', gain: 0.22, delaySec: 0.045, sustainRatio: 0.45 });
    return;
  }
  playTone(480, 0.08, { type: 'triangle', gain: 0.2, endFrequency: 760, sustainRatio: 0.4 });
}

export function playSfxHeal(): void {
  playTone(523.25, 0.08, { type: 'triangle', gain: 0.22, sustainRatio: 0.45 });
  playTone(659.25, 0.09, { type: 'triangle', gain: 0.24, delaySec: 0.05, sustainRatio: 0.45 });
  playTone(987.77, 0.17, { type: 'sine', gain: 0.24, delaySec: 0.1, sustainRatio: 0.5 });
}

export function playSfxFanfare(victory = false): void {
  if (victory) {
    playTone(523.25, 0.1, { type: 'triangle', gain: 0.24, sustainRatio: 0.55 });
    playTone(659.25, 0.1, { type: 'triangle', gain: 0.26, delaySec: 0.08, sustainRatio: 0.55 });
    playTone(783.99, 0.12, { type: 'triangle', gain: 0.28, delaySec: 0.16, sustainRatio: 0.55 });
    playTone(1046.5, 0.28, { type: 'triangle', gain: 0.3, delaySec: 0.24, sustainRatio: 0.55 });
    return;
  }
  playTone(440, 0.09, { type: 'triangle', gain: 0.22, sustainRatio: 0.5 });
  playTone(554.37, 0.09, { type: 'triangle', gain: 0.24, delaySec: 0.07, sustainRatio: 0.5 });
  playTone(659.25, 0.2, { type: 'triangle', gain: 0.26, delaySec: 0.14, sustainRatio: 0.5 });
}

/** Tactile mechanical console switch sound when clicking UI buttons or tabs. */
export function playUiClick(): void {
  playTone(290, 0.032, { type: 'sine', gain: 0.24, endFrequency: 105, sustainRatio: 0.15 });
  playNoiseTick(2400, 2.2, 0.011, 0.14);
}

/** Tactile switch + warm two-note pop on confirmation actions. */
export function playUiConfirm(): void {
  playNoiseTick(2400, 2.2, 0.011, 0.13);
  playTone(523.25, 0.065, { type: 'sine', gain: 0.22, sustainRatio: 0.28 });
  playTone(783.99, 0.11, { type: 'sine', gain: 0.24, delaySec: 0.048, sustainRatio: 0.32 });
  playTone(1567.98, 0.08, { type: 'sine', gain: 0.07, delaySec: 0.048, sustainRatio: 0.2 });
}
