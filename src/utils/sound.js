const MUTE_STORAGE_KEY = 'kaizen_award_sound_muted_v1';
const BGM_STORAGE_KEY = 'kaizen_award_bgm_enabled_v1';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmEnabled = false;
    this.bgmTimer = null;
    this.bgmStep = 0;

    try {
      this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
      this.bgmEnabled = localStorage.getItem(BGM_STORAGE_KEY) === 'true';
    } catch {
      this.muted = false;
      this.bgmEnabled = false;
    }
  }

  _ensureContext() {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    } catch {
      // ignore
    }
    if (this.muted) {
      this._stopBgmLoop();
    } else if (this.bgmEnabled) {
      this._startBgmLoop();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playButton();
    }
    return this.muted;
  }

  isBgmEnabled() {
    return this.bgmEnabled && !this.muted;
  }

  toggleBgm() {
    if (this.muted) {
      this.setMuted(false);
    }
    this.bgmEnabled = !this.bgmEnabled;
    try {
      localStorage.setItem(BGM_STORAGE_KEY, String(this.bgmEnabled));
    } catch {
      // ignore
    }
    if (this.bgmEnabled) {
      this._startBgmLoop();
      this.playButton();
    } else {
      this._stopBgmLoop();
    }
    return this.isBgmEnabled();
  }

  /** Light, cheerful, upbeat game-show synth marimba loop (zero external audio files) */
  _startBgmLoop() {
    if (this.bgmTimer || this.muted || !this.bgmEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    // Bright C-major / A-minor / F-major / G-major bubbly 16-step arcade groove
    const melody = [
      523.25, 0, 659.25, 783.99,
      659.25, 0, 523.25, 659.25,
      440.0, 0, 523.25, 659.25,
      587.33, 659.25, 783.99, 0,
    ];
    const bass = [
      130.81, 0, 0, 0,
      196.0, 0, 0, 0,
      174.61, 0, 0, 0,
      196.0, 0, 146.83, 0,
    ];

    const playStep = () => {
      if (this.muted || !this.bgmEnabled) {
        this._stopBgmLoop();
        return;
      }
      const audioCtx = this._ensureContext();
      if (!audioCtx || audioCtx.state !== 'running') return;

      const now = audioCtx.currentTime;
      const step = this.bgmStep % melody.length;
      const mFreq = melody[step];
      const bFreq = bass[step];

      if (mFreq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(mFreq, now);
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(0.032, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.21);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      if (bFreq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bFreq, now);
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(0.036, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.36);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      }

      this.bgmStep = (this.bgmStep + 1) % melody.length;
    };

    playStep();
    this.bgmTimer = setInterval(playStep, 235);
  }

  _stopBgmLoop() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playTick(progress = 0) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 520 + progress * 280;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.48, now + 0.038);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.042);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.048);
  }

  playReveal() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  playStart() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    if (this.bgmEnabled && !this.bgmTimer) this._startBgmLoop();
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  playButton() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.045);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playPickup() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playDrop() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  playSnap(comboCount = 1) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(260, now);
    popOsc.frequency.exponentialRampToValueAtTime(640, now + 0.045);
    popGain.gain.setValueAtTime(0.001, now);
    popGain.gain.linearRampToValueAtTime(0.18, now + 0.005);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.07);

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const idx = Math.min(Math.max(0, comboCount - 1), pentatonic.length - 1);
    const freq = pentatonic[idx];

    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(freq, now + 0.02);

    bellGain.gain.setValueAtTime(0.001, now + 0.02);
    bellGain.gain.linearRampToValueAtTime(0.15, now + 0.032);
    bellGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.34);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now + 0.02);
    bellOsc.stop(now + 0.36);

    if (comboCount >= 2) {
      const sparkOsc = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      sparkOsc.type = 'triangle';
      sparkOsc.frequency.setValueAtTime(freq * 1.5, now + 0.065);
      sparkGain.gain.setValueAtTime(0.001, now + 0.065);
      sparkGain.gain.linearRampToValueAtTime(0.1, now + 0.08);
      sparkGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.32);
      sparkOsc.connect(sparkGain);
      sparkGain.connect(ctx.destination);
      sparkOsc.start(now + 0.065);
      sparkOsc.stop(now + 0.35);
    }
  }

  playHint() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [740, 987.77].forEach((freq, i) => {
      const t = now + i * 0.095;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  playQuizCorrect() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, i) => {
      const t = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  playQuizWrong() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [280, 220].forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  playVictory() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const melody = [
      { f: 523.25, t: 0.0, d: 0.14 },
      { f: 659.25, t: 0.12, d: 0.14 },
      { f: 783.99, t: 0.24, d: 0.14 },
      { f: 1046.5, t: 0.38, d: 0.28 },
      { f: 783.99, t: 0.56, d: 0.14 },
      { f: 1046.5, t: 0.72, d: 0.65 },
    ];

    melody.forEach(({ f, t, d }) => {
      const start = now + t;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      osc2.frequency.setValueAtTime(f * 2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + d + 0.18);

      const g2 = ctx.createGain();
      g2.gain.value = 0.28;

      osc.connect(gain);
      osc2.connect(g2);
      g2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + d + 0.22);
      osc2.stop(start + d + 0.22);
    });

    [523.25, 659.25, 783.99].forEach((freq) => {
      const start = now + 0.72;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.95);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.0);
    });
  }
}

export const sound = new SoundEngine();
