// Web Audio API procedural sound generator - 100% offline, zero external dependencies

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: "none" | "rain" | "noise" | "cafe" | "drone" = "none";
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.currentType = "none";
    this.activeNodes.forEach(node => {
      if (typeof node === "number") {
        window.clearInterval(node);
      } else {
        try {
          (node as AudioScheduledSourceNode).stop?.();
          node.disconnect();
        } catch {}
      }
    });
    this.activeNodes = [];
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }

  public play(type: "rain" | "noise" | "cafe" | "drone", volume = 0.4) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
    this.currentType = type;

    if (type === "noise") {
      this.createPinkNoise();
    } else if (type === "rain") {
      this.createRain();
    } else if (type === "drone") {
      this.createBinauralDrone();
    } else if (type === "cafe") {
      this.createCafeAtmosphere();
    }
  }

  private createPinkNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Paul Kellet's refined 1/f pink noise filter with velvety smoothing
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Dual-stage Butterworth-style lowpass filters for ultra-clean, non-fatiguing smooth noise
    const lowpass1 = this.ctx.createBiquadFilter();
    lowpass1.type = "lowpass";
    lowpass1.frequency.setValueAtTime(950, this.ctx.currentTime);
    lowpass1.Q.setValueAtTime(0.5, this.ctx.currentTime);

    const lowpass2 = this.ctx.createBiquadFilter();
    lowpass2.type = "lowpass";
    lowpass2.frequency.setValueAtTime(1600, this.ctx.currentTime);
    lowpass2.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // Subtle warm bass presence
    const bass = this.ctx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.setValueAtTime(150, this.ctx.currentTime);
    bass.gain.setValueAtTime(2.5, this.ctx.currentTime);

    noise.connect(bass);
    bass.connect(lowpass1);
    lowpass1.connect(lowpass2);
    lowpass2.connect(this.gainNode);
    noise.start();

    this.activeNodes.push(noise, bass, lowpass1, lowpass2);
  }

  private createRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.22;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(750, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.6, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1900, this.ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(this.gainNode);
    source.start();

    this.activeNodes.push(source, bandpass, lowpass);
  }

  private createBinauralDrone() {
    if (!this.ctx || !this.gainNode) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    // 432 Hz Pythagorean sacred tuning & alpha wave binaural beat
    osc1.frequency.setValueAtTime(216.0, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(226.0, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    osc1.connect(subGain);
    osc2.connect(subGain);
    subGain.connect(this.gainNode);

    osc1.start();
    osc2.start();

    this.activeNodes.push(osc1, osc2, subGain);
  }

  // Realistic Coffee Shop: Distant human murmur + authentic periodic porcelain/cup clinks
  private createCafeAtmosphere() {
    if (!this.ctx || !this.gainNode) return;

    // 1. Layer 1: Ambient Room Murmur & Speech Formants
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.14;
    }

    const murmurSource = this.ctx.createBufferSource();
    murmurSource.buffer = buffer;
    murmurSource.loop = true;

    // Vocal tract formant filter 1: male/female vocal fundamental range (~380 Hz)
    const formant1 = this.ctx.createBiquadFilter();
    formant1.type = "bandpass";
    formant1.frequency.setValueAtTime(380, this.ctx.currentTime);
    formant1.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Vocal presence formant filter 2: speech intelligibility band (~950 Hz)
    const formant2 = this.ctx.createBiquadFilter();
    formant2.type = "bandpass";
    formant2.frequency.setValueAtTime(950, this.ctx.currentTime);
    formant2.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Lowpass room acoustics
    const roomAcoustics = this.ctx.createBiquadFilter();
    roomAcoustics.type = "lowpass";
    roomAcoustics.frequency.setValueAtTime(520, this.ctx.currentTime);

    // Dynamic speech rise-and-fall LFO (human rhythm)
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // 0.18 Hz slow conversation rhythm

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    const murmurGain = this.ctx.createGain();
    murmurGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(murmurGain.gain);

    murmurSource.connect(formant1);
    murmurSource.connect(formant2);
    formant1.connect(roomAcoustics);
    formant2.connect(roomAcoustics);
    roomAcoustics.connect(murmurGain);
    murmurGain.connect(this.gainNode);

    murmurSource.start();
    lfo.start();

    this.activeNodes.push(murmurSource, formant1, formant2, roomAcoustics, lfo, lfoGain, murmurGain);

    // 2. Layer 2: Delicate Porcelain Cup & Saucer Clinks (Fincan / Bardak Tıkırtıları)
    const triggerCupClink = () => {
      if (!this.ctx || !this.gainNode || this.currentType !== "cafe") return;

      try {
        const now = this.ctx.currentTime;
        // Dual resonance frequencies simulating ceramic / glass ping
        const fundamental = 2600 + (Math.random() * 800 - 400); // 2200 - 3000 Hz
        const overtone = fundamental * 1.48; // ~3800 Hz

        const oscMain = this.ctx.createOscillator();
        const oscHarmonic = this.ctx.createOscillator();
        oscMain.type = "sine";
        oscHarmonic.type = "sine";
        oscMain.frequency.setValueAtTime(fundamental, now);
        oscHarmonic.frequency.setValueAtTime(overtone, now);

        const clinkGain = this.ctx.createGain();
        const clinkVol = 0.035 + Math.random() * 0.035; // Gentle, distant clink
        clinkGain.gain.setValueAtTime(0, now);
        clinkGain.gain.linearRampToValueAtTime(clinkVol, now + 0.003); // Fast 3ms transient attack
        clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14); // 140ms natural ring decay

        oscMain.connect(clinkGain);
        oscHarmonic.connect(clinkGain);
        clinkGain.connect(this.gainNode);

        oscMain.start(now);
        oscHarmonic.start(now);
        oscMain.stop(now + 0.16);
        oscHarmonic.stop(now + 0.16);
      } catch {}
    };

    // Schedule periodic clinks randomly every 3 to 7 seconds
    const intervalId = window.setInterval(() => {
      if (Math.random() > 0.3) {
        triggerCupClink();
        // Occasionally double tap (spoon hitting cup twice)
        if (Math.random() > 0.6) {
          window.setTimeout(() => triggerCupClink(), 120 + Math.random() * 80);
        }
      }
    }, 3800);

    this.activeNodes.push(intervalId as unknown as number);
  }

  public getCurrent() {
    return this.currentType;
  }
}

export const ambientSound = typeof window !== "undefined" ? new AmbientSoundEngine() : null;
